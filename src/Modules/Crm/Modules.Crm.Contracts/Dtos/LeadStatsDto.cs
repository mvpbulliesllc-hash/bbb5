namespace FSH.Modules.Crm.Contracts.Dtos;

/// <summary>Count of leads in a given pipeline status.</summary>
public sealed record LeadStatusCountDto(LeadStatus Status, int Count);

/// <summary>Count of leads that arrived through a given marketing channel.</summary>
public sealed record LeadSourceCountDto(LeadSource Source, int Count);

/// <summary>Count of leads requesting a given service.</summary>
public sealed record LeadServiceTypeCountDto(ServiceType ServiceType, int Count);

/// <summary>Leads captured in the ISO week starting on <paramref name="WeekStart"/> (a Monday).</summary>
public sealed record WeeklyLeadCountDto(DateOnly WeekStart, int Count);

/// <summary>
/// Aggregated pipeline analytics, shaped for direct charting in the admin UI:
/// each breakdown is an ordered list of (label, count) pairs, and
/// <see cref="LeadsPerWeek"/> is a zero-filled 12-week series.
/// </summary>
public sealed record LeadStatsDto(
    int TotalLeads,
    IReadOnlyList<LeadStatusCountDto> ByStatus,
    IReadOnlyList<LeadSourceCountDto> BySource,
    IReadOnlyList<LeadServiceTypeCountDto> ByServiceType,
    IReadOnlyList<WeeklyLeadCountDto> LeadsPerWeek,
    double ConversionRate,
    decimal PipelineValue,
    decimal WonValue);
