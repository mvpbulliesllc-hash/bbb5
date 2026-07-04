using FSH.Modules.Crm.Contracts.Dtos;

namespace FSH.Modules.Crm.Features.v1.Leads.GetLeadStats;

/// <summary>
/// Pure aggregation logic behind GetLeadStats, factored out of the handler
/// so week-bucketing and conversion math are unit-testable without a database.
/// </summary>
public static class LeadStatsCalculator
{
    /// <summary>Number of weekly buckets returned by <see cref="BuildWeeklyBuckets"/>.</summary>
    public const int WeeksWindow = 12;

    /// <summary>Returns the Monday on or before the given date (ISO week start).</summary>
    public static DateOnly WeekStartOf(DateOnly date)
    {
        int daysSinceMonday = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-daysSinceMonday);
    }

    /// <summary>
    /// Returns the UTC instant the 12-week window opens at — the Monday
    /// 11 full weeks before the week containing <paramref name="nowUtc"/>.
    /// Use it to pre-filter the capture-timestamp query.
    /// </summary>
    public static DateTimeOffset WindowStartUtc(DateTimeOffset nowUtc)
    {
        var windowStart = WeekStartOf(DateOnly.FromDateTime(nowUtc.UtcDateTime)).AddDays(-7 * (WeeksWindow - 1));
        return new DateTimeOffset(windowStart, TimeOnly.MinValue, TimeSpan.Zero);
    }

    /// <summary>
    /// Buckets capture timestamps into the last 12 ISO weeks (oldest first,
    /// current week last). Every week is present — empty weeks are
    /// zero-filled — so the series charts without client-side gap handling.
    /// Timestamps outside the window are ignored.
    /// </summary>
    public static IReadOnlyList<WeeklyLeadCountDto> BuildWeeklyBuckets(
        IEnumerable<DateTimeOffset> capturedOnUtc,
        DateTimeOffset nowUtc)
    {
        ArgumentNullException.ThrowIfNull(capturedOnUtc);

        var currentWeekStart = WeekStartOf(DateOnly.FromDateTime(nowUtc.UtcDateTime));
        var firstWeekStart = currentWeekStart.AddDays(-7 * (WeeksWindow - 1));

        var counts = new int[WeeksWindow];
        foreach (var capturedOn in capturedOnUtc)
        {
            var weekStart = WeekStartOf(DateOnly.FromDateTime(capturedOn.UtcDateTime));
            int index = (weekStart.DayNumber - firstWeekStart.DayNumber) / 7;
            if (index is >= 0 and < WeeksWindow)
            {
                counts[index]++;
            }
        }

        var buckets = new List<WeeklyLeadCountDto>(WeeksWindow);
        for (int i = 0; i < WeeksWindow; i++)
        {
            buckets.Add(new WeeklyLeadCountDto(firstWeekStart.AddDays(7 * i), counts[i]));
        }
        return buckets;
    }

    /// <summary>
    /// Conversion rate = Won / (Won + Lost). Returns 0 when no lead has
    /// closed yet (rather than dividing by zero).
    /// </summary>
    public static double ConversionRate(int won, int lost)
    {
        int closed = won + lost;
        return closed == 0 ? 0d : (double)won / closed;
    }
}
