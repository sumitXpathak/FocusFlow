package expo.modules.appblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageStats
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
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat

class BlockingService : Service() {
    private var isRunning = false
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private var blockedPackages = listOf<String>()

    companion object {
        var activeBlockedPackages: List<String> = emptyList()
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val packages = intent?.getStringArrayExtra("BLOCKED_PACKAGES")
        if (packages != null) {
            blockedPackages = packages.toList()
            activeBlockedPackages = blockedPackages
        }

        val notification = NotificationCompat.Builder(this, "FocusFlowChannel")
            .setContentTitle("FocusFlow is active")
            .setContentText("App blocking is enabled.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .build()

        startForeground(1, notification)

        if (!isRunning) {
            isRunning = true
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

    private val checkForegroundAppRunnable = object : Runnable {
        override fun run() {
            if (!isRunning) return
            
            val currentApp = getForegroundApp()
            if (currentApp != null && blockedPackages.contains(currentApp)) {
                showOverlay()
            } else {
                removeOverlay()
            }
            
            handler.postDelayed(this, 1000)
        }
    }

    private fun getForegroundApp(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 10, time)
        
        if (stats != null) {
            var latestStat: UsageStats? = null
            for (stat in stats) {
                if (latestStat == null || stat.lastTimeUsed > latestStat.lastTimeUsed) {
                    latestStat = stat
                }
            }
            return latestStat?.packageName
        }
        return null
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

        // We dynamically create a simple full screen view instead of inflating from XML to avoid missing resource issues.
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
        if (overlayView != null) {
            windowManager.removeView(overlayView)
            overlayView = null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "FocusFlowChannel",
                "FocusFlow Blocking Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
}
