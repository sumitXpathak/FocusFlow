package expo.modules.appblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.util.Calendar

class BlockingService : Service() {
    private var isRunning = false
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private var lastForegroundPackage: String? = null

    // ── Enforcement config (source of truth, persisted to SharedPreferences) ──
    private var masterEnabled = true
    private var focusActive = false
    private var focusPackages = setOf<String>()
    private var limits = mapOf<String, Int>()            // packageName → daily minutes
    private var schedules = listOf<ScheduleRule>()

    // Throttled over-limit computation (usage is expensive; recompute every ~5s)
    private var overLimitSet = setOf<String>()
    private var lastUsageComputeAt = 0L

    data class ScheduleRule(
        val active: Boolean,
        val days: Set<Int>,          // 0 = Mon … 6 = Sun
        val startMinutes: Int,
        val endMinutes: Int,
        val packages: Set<String>,
    )

    companion object {
        var activeBlockedPackages: List<String> = emptyList()

        const val PREFS_NAME = "focusflow_enforcement"
        const val KEY_CONFIG = "config_json"
        const val EXTRA_CONFIG = "ENFORCEMENT_CONFIG"

        private const val USAGE_RECOMPUTE_MS = 5000L
        private const val TICK_MS = 800L
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        // Restore config on cold restart (START_STICKY re-delivers a null intent).
        loadConfigFromPrefs()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Fresh config from JS, if this start carried one. On a sticky restart
        // the intent is null and we keep whatever onCreate loaded from prefs.
        val json = intent?.getStringExtra(EXTRA_CONFIG)
        if (json != null) parseConfig(json)

        startForeground(1, buildNotification())

        if (!isRunning) {
            isRunning = true
            lastUsageComputeAt = 0L
            handler.post(checkForegroundAppRunnable)
        }

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        handler.removeCallbacks(checkForegroundAppRunnable)
        removeOverlay()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ── Config parsing / persistence ─────────────────────────
    private fun loadConfigFromPrefs() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(KEY_CONFIG, null) ?: return
        parseConfig(json)
    }

    private fun parseConfig(json: String) {
        try {
            val root = JSONObject(json)
            masterEnabled = root.optBoolean("masterEnabled", true)
            focusActive = root.optBoolean("focusActive", false)

            focusPackages = root.optJSONArray("focusPackages").toStringSet()

            val limitMap = HashMap<String, Int>()
            root.optJSONArray("limits")?.let { arr ->
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    val pkg = o.optString("packageName", "")
                    if (pkg.isEmpty()) continue
                    limitMap[pkg] = o.optInt("dailyLimitMinutes", Int.MAX_VALUE)
                }
            }
            limits = limitMap

            val rules = ArrayList<ScheduleRule>()
            root.optJSONArray("schedules")?.let { arr ->
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    val days = HashSet<Int>()
                    o.optJSONArray("days")?.let { d ->
                        for (j in 0 until d.length()) days.add(d.optInt(j))
                    }
                    rules.add(
                        ScheduleRule(
                            active = o.optBoolean("active", true),
                            days = days,
                            startMinutes = o.optInt("startMinutes", 0),
                            endMinutes = o.optInt("endMinutes", 0),
                            packages = o.optJSONArray("packages").toStringSet(),
                        )
                    )
                }
            }
            schedules = rules

            // Force a fresh over-limit computation on the next tick.
            lastUsageComputeAt = 0L
        } catch (_: Exception) {
            // Malformed config — keep the previous values rather than crash.
        }
    }

    private fun org.json.JSONArray?.toStringSet(): Set<String> {
        if (this == null) return emptySet()
        val set = HashSet<String>()
        for (i in 0 until length()) {
            val s = optString(i, "")
            if (s.isNotEmpty()) set.add(s)
        }
        return set
    }

    // ── The enforcement tick ─────────────────────────────────
    private val checkForegroundAppRunnable = object : Runnable {
        override fun run() {
            if (!isRunning) return

            val blockNow = computeBlockedSet()
            activeBlockedPackages = blockNow.toList()

            val currentApp = getForegroundApp()
            if (currentApp != null && currentApp != packageName && blockNow.contains(currentApp)) {
                showOverlay()
            } else {
                removeOverlay()
            }

            handler.postDelayed(this, TICK_MS)
        }
    }

    private fun computeBlockedSet(): Set<String> {
        if (!masterEnabled) return emptySet()

        val blocked = HashSet<String>()

        // 1. Focus session apps (only while a focus timer is running).
        if (focusActive) blocked.addAll(focusPackages)

        // 2. Apps that have crossed their daily limit (throttled recompute).
        val now = System.currentTimeMillis()
        if (now - lastUsageComputeAt >= USAGE_RECOMPUTE_MS) {
            overLimitSet = computeOverLimit(now)
            lastUsageComputeAt = now
        }
        blocked.addAll(overLimitSet)

        // 3. Apps inside an active schedule window.
        for (rule in schedules) {
            if (rule.active && isScheduleActiveNow(rule)) blocked.addAll(rule.packages)
        }

        return blocked
    }

    private fun computeOverLimit(now: Long): Set<String> {
        if (limits.isEmpty()) return emptySet()
        val usage = UsageAggregator.foregroundMillis(this, startOfToday(), now)
        val over = HashSet<String>()
        for ((pkg, limitMinutes) in limits) {
            val usedMinutes = (usage[pkg] ?: 0L) / 60000.0
            if (usedMinutes >= limitMinutes) over.add(pkg)
        }
        return over
    }

    private fun isScheduleActiveNow(rule: ScheduleRule): Boolean {
        val cal = Calendar.getInstance()
        // Calendar: SUNDAY=1 … SATURDAY=7. Map to Mon=0 … Sun=6.
        val dow = (cal.get(Calendar.DAY_OF_WEEK) + 5) % 7
        val minutesNow = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)

        return if (rule.endMinutes >= rule.startMinutes) {
            // Same-day window. Day must match the current day.
            rule.days.contains(dow) &&
                minutesNow >= rule.startMinutes && minutesNow < rule.endMinutes
        } else {
            // Overnight wrap (e.g. 21:00 → 06:00). The morning tail belongs to
            // the *previous* day's schedule entry.
            val yesterday = (dow + 6) % 7
            (rule.days.contains(dow) && minutesNow >= rule.startMinutes) ||
                (rule.days.contains(yesterday) && minutesNow < rule.endMinutes)
        }
    }

    private fun startOfToday(): Long {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    private fun getForegroundApp(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        // queryEvents reflects foreground changes within ~1s — required for
        // real-time blocking (queryUsageStats lags by minutes).
        val events = usageStatsManager.queryEvents(now - 1000 * 10, now)
        val event = UsageEvents.Event()
        var latestPackage: String? = null
        var latestTime = 0L

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val isForegroundEvent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                event.eventType == UsageEvents.Event.ACTIVITY_RESUMED
            } else {
                @Suppress("DEPRECATION")
                event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND
            }
            if (isForegroundEvent && event.timeStamp >= latestTime) {
                latestTime = event.timeStamp
                latestPackage = event.packageName
            }
        }

        if (latestPackage != null) {
            lastForegroundPackage = latestPackage
        }
        return lastForegroundPackage
    }

    private fun showOverlay() {
        if (overlayView != null) return

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )
        params.gravity = Gravity.CENTER

        // Built in code rather than inflated from XML to avoid missing-resource issues.
        val context = this
        overlayView = android.widget.LinearLayout(context).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#FF6B35")) // FocusFlow Orange

            val title = TextView(context).apply {
                text = "Focus Mode Active"
                textSize = 32f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, 30)
            }

            val subtitle = TextView(context).apply {
                text = "This app is blocked. Get back to work!"
                textSize = 18f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
            }

            val btn = Button(context).apply {
                text = "Go Home"
                setOnClickListener {
                    val startMain = Intent(Intent.ACTION_MAIN)
                    startMain.addCategory(Intent.CATEGORY_HOME)
                    startMain.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    context.startActivity(startMain)
                }
            }

            addView(title)
            addView(subtitle)
            addView(btn)
        }

        windowManager.addView(overlayView, params)
    }

    private fun removeOverlay() {
        val view = overlayView ?: return
        try {
            windowManager.removeView(view)
        } catch (_: Exception) {
            // View may already be detached — ignore.
        }
        overlayView = null
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, "FocusFlowChannel")
            .setContentTitle("FocusFlow is active")
            .setContentText("App blocking is enabled.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "FocusFlowChannel",
                "FocusFlow Blocking Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }
}
