package expo.modules.appblocker

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build

/**
 * Shared foreground-usage math used by both the [BlockingService] (to decide
 * which apps are over their daily limit) and [ExpoAppBlockerModule.getUsageStats]
 * (to feed real "used today" minutes back to the UI).
 *
 * We aggregate RESUMED → PAUSED event pairs rather than reading queryUsageStats
 * daily totals: pairs give us usage *since an arbitrary start* (local midnight),
 * so the daily counter resets on its own and can't double-count across the
 * INTERVAL_DAILY bucket boundary.
 */
object UsageAggregator {

    /** packageName → foreground milliseconds in [start, end]. */
    fun foregroundMillis(context: Context, start: Long, end: Long): Map<String, Long> {
        val result = HashMap<String, Long>()
        if (end <= start) return result

        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return result
        val events = usm.queryEvents(start, end)
        val event = UsageEvents.Event()
        val lastResume = HashMap<String, Long>()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val pkg = event.packageName ?: continue

            val isForeground: Boolean
            val isBackground: Boolean
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                isForeground = event.eventType == UsageEvents.Event.ACTIVITY_RESUMED
                isBackground = event.eventType == UsageEvents.Event.ACTIVITY_PAUSED ||
                    event.eventType == UsageEvents.Event.ACTIVITY_STOPPED
            } else {
                @Suppress("DEPRECATION")
                isForeground = event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND
                @Suppress("DEPRECATION")
                isBackground = event.eventType == UsageEvents.Event.MOVE_TO_BACKGROUND
            }

            if (isForeground) {
                // Only record the first resume; nested resumes keep the earliest.
                if (!lastResume.containsKey(pkg)) lastResume[pkg] = event.timeStamp
            } else if (isBackground) {
                val resumedAt = lastResume.remove(pkg)
                if (resumedAt != null && event.timeStamp > resumedAt) {
                    result[pkg] = (result[pkg] ?: 0L) + (event.timeStamp - resumedAt)
                }
            }
        }

        // Apps still in the foreground at `end` (resumed, never paused in-window).
        for ((pkg, resumedAt) in lastResume) {
            if (end > resumedAt) result[pkg] = (result[pkg] ?: 0L) + (end - resumedAt)
        }

        return result
    }
}
