package expo.modules.appblocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

class ExpoAppBlockerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAppBlocker")

    // ── Installed-app discovery ────────────────────────────
    // Returns every user-facing (launchable) app on the device, sorted
    // alphabetically by display name. Skips the FocusFlow app itself.
    Function("getInstalledApps") {
      val context = appContext.reactContext
        ?: return@Function emptyList<Map<String, String>>()
      val pm = context.packageManager
      val launcherIntent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      @Suppress("DEPRECATION")
      val resolveInfos = pm.queryIntentActivities(launcherIntent, 0)
      resolveInfos.mapNotNull { ri ->
        val pkg = ri.activityInfo.packageName
        if (pkg == context.packageName) return@mapNotNull null // skip self
        mapOf(
          "packageName" to pkg,
          "name" to ri.loadLabel(pm).toString()
        )
      }.sortedBy { it["name"]?.lowercase() }
    }

    // ── Enforcement ────────────────────────────────────────
    // Declarative config pushed from JS. The BlockingService is the source of
    // truth for "what should be blocked right now"; JS just describes the
    // rules (focus apps, per-app limits, schedules, master toggle).
    Function("updateEnforcementConfig") { configJson: String ->
      val context = appContext.reactContext ?: return@Function null
      persistConfig(context, configJson)
      startServiceWithConfig(context, configJson)
    }

    // packageName → minutes used since `sinceEpochMillis` (local-midnight from JS).
    Function("getUsageStats") { sinceEpochMillis: Double ->
      val context = appContext.reactContext ?: return@Function emptyMap<String, Double>()
      val start = sinceEpochMillis.toLong()
      val now = System.currentTimeMillis()
      UsageAggregator.foregroundMillis(context, start, now)
        .mapValues { it.value / 60000.0 }
    }

    // Legacy focus-only entry point kept for backwards-compatibility. Prefer
    // updateEnforcementConfig, which composes focus with limits + schedules.
    Function("startBlocking") { packages: List<String> ->
      val context = appContext.reactContext ?: return@Function null
      val json = JSONObject().apply {
        put("masterEnabled", true)
        put("focusActive", true)
        put("focusPackages", JSONArray(packages))
        put("limits", JSONArray())
        put("schedules", JSONArray())
      }.toString()
      persistConfig(context, json)
      startServiceWithConfig(context, json)
    }

    // Stops the enforcement service entirely. Callers should only use this when
    // there is nothing left to enforce (no focus, no limits, no active
    // schedules) — otherwise limits/schedules would silently stop working.
    Function("stopBlocking") {
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(context, BlockingService::class.java)
      context.stopService(intent)
    }

    // ── Permissions ────────────────────────────────────────
    Function("hasUsagePermission") { ->
      val context = appContext.reactContext ?: return@Function false
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
      } else {
        appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
      }
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("hasOverlayPermission") { ->
      val context = appContext.reactContext ?: return@Function false
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Settings.canDrawOverlays(context)
      } else {
        true
      }
    }

    Function("requestUsagePermission") {
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      context.startActivity(intent)
    }

    Function("requestOverlayPermission") {
      val context = appContext.reactContext ?: return@Function null
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + context.packageName))
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        context.startActivity(intent)
      }
    }
  }

  // ── helpers ──────────────────────────────────────────────
  private fun persistConfig(context: Context, configJson: String) {
    context.getSharedPreferences(BlockingService.PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(BlockingService.KEY_CONFIG, configJson)
      .apply()
  }

  private fun startServiceWithConfig(context: Context, configJson: String) {
    val intent = Intent(context, BlockingService::class.java)
    intent.putExtra(BlockingService.EXTRA_CONFIG, configJson)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(intent)
    } else {
      context.startService(intent)
    }
  }
}
