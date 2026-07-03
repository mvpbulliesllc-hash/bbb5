using FSH.Modules.Crm.Features.v1.Leads.GetLeadStats;

namespace Crm.Tests.Features;

public sealed class LeadStatsCalculatorTests
{
    // Wednesday 2026-07-01 12:00 UTC — week starts Monday 2026-06-29.
    private static readonly DateTimeOffset Now = new(2026, 7, 1, 12, 0, 0, TimeSpan.Zero);
    private static readonly DateOnly CurrentWeekStart = new(2026, 6, 29);

    #region WeekStartOf

    [Theory]
    [InlineData(2026, 6, 29)] // Monday maps to itself
    [InlineData(2026, 7, 1)]  // Wednesday
    [InlineData(2026, 7, 5)]  // Sunday
    public void WeekStartOf_Should_ReturnMonday_When_GivenAnyDayOfWeek(int year, int month, int day)
    {
        // Act
        DateOnly weekStart = LeadStatsCalculator.WeekStartOf(new DateOnly(year, month, day));

        // Assert
        weekStart.ShouldBe(CurrentWeekStart);
        weekStart.DayOfWeek.ShouldBe(DayOfWeek.Monday);
    }

    #endregion

    #region WindowStartUtc

    [Fact]
    public void WindowStartUtc_Should_Return11WeeksBeforeCurrentWeekStart_When_Called()
    {
        // Act
        DateTimeOffset windowStart = LeadStatsCalculator.WindowStartUtc(Now);

        // Assert — Monday 2026-04-13 is 11 full weeks before Monday 2026-06-29.
        windowStart.ShouldBe(new DateTimeOffset(2026, 4, 13, 0, 0, 0, TimeSpan.Zero));
    }

    #endregion

    #region BuildWeeklyBuckets (Happy Path)

    [Fact]
    public void BuildWeeklyBuckets_Should_Return12ZeroFilledBuckets_When_NoLeads()
    {
        // Act
        var buckets = LeadStatsCalculator.BuildWeeklyBuckets([], Now);

        // Assert
        buckets.Count.ShouldBe(12);
        buckets.ShouldAllBe(b => b.Count == 0);
        buckets[0].WeekStart.ShouldBe(new DateOnly(2026, 4, 13));
        buckets[^1].WeekStart.ShouldBe(CurrentWeekStart);
    }

    [Fact]
    public void BuildWeeklyBuckets_Should_CountLeadsInTheirWeek_When_LeadsSpanWeeks()
    {
        // Arrange
        DateTimeOffset[] capturedOn =
        [
            new(2026, 6, 29, 8, 0, 0, TimeSpan.Zero),  // current week (Mon)
            new(2026, 7, 1, 9, 30, 0, TimeSpan.Zero),  // current week (Wed)
            new(2026, 6, 24, 17, 0, 0, TimeSpan.Zero), // previous week
            new(2026, 4, 13, 0, 0, 0, TimeSpan.Zero),  // oldest week, first instant
        ];

        // Act
        var buckets = LeadStatsCalculator.BuildWeeklyBuckets(capturedOn, Now);

        // Assert
        buckets[^1].Count.ShouldBe(2);
        buckets[^2].Count.ShouldBe(1);
        buckets[0].Count.ShouldBe(1);
        buckets.Sum(b => b.Count).ShouldBe(4);
    }

    [Fact]
    public void BuildWeeklyBuckets_Should_OrderWeeksOldestFirst_When_Built()
    {
        // Act
        var buckets = LeadStatsCalculator.BuildWeeklyBuckets([], Now);

        // Assert
        for (int i = 1; i < buckets.Count; i++)
        {
            buckets[i].WeekStart.ShouldBe(buckets[i - 1].WeekStart.AddDays(7));
        }
    }

    #endregion

    #region BuildWeeklyBuckets (Edge Cases)

    [Fact]
    public void BuildWeeklyBuckets_Should_IgnoreLeads_When_OlderThanWindow()
    {
        // Arrange — Sunday 2026-04-12 is the last day before the window opens.
        DateTimeOffset[] capturedOn = [new(2026, 4, 12, 23, 59, 59, TimeSpan.Zero)];

        // Act
        var buckets = LeadStatsCalculator.BuildWeeklyBuckets(capturedOn, Now);

        // Assert
        buckets.Sum(b => b.Count).ShouldBe(0);
    }

    [Fact]
    public void BuildWeeklyBuckets_Should_Throw_When_TimestampsAreNull()
    {
        // Act / Assert
        Should.Throw<ArgumentNullException>(() => LeadStatsCalculator.BuildWeeklyBuckets(null!, Now));
    }

    #endregion

    #region ConversionRate

    [Fact]
    public void ConversionRate_Should_ReturnZero_When_NoClosedLeads()
    {
        // Act / Assert
        LeadStatsCalculator.ConversionRate(0, 0).ShouldBe(0d);
    }

    [Theory]
    [InlineData(1, 0, 1d)]
    [InlineData(0, 1, 0d)]
    [InlineData(3, 1, 0.75d)]
    [InlineData(1, 3, 0.25d)]
    public void ConversionRate_Should_ComputeWonOverClosed_When_LeadsClosed(int won, int lost, double expected)
    {
        // Act / Assert
        LeadStatsCalculator.ConversionRate(won, lost).ShouldBe(expected, tolerance: 0.0001d);
    }

    #endregion
}
