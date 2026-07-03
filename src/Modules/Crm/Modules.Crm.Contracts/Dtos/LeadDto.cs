namespace FSH.Modules.Crm.Contracts.Dtos;

/// <summary>
/// Read-side projection of a lead. Notes are returned via the dedicated
/// `/crm/leads/{id}/notes` endpoint to keep this DTO small; NoteCount
/// lets list views show activity without loading the note bodies.
/// </summary>
public sealed record LeadDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    string? Address,
    string? City,
    string? ZipCode,
    ServiceType ServiceType,
    string? Message,
    ContactMethod PreferredContactMethod,
    LeadStatus Status,
    LeadSource Source,
    string? UtmSource,
    string? UtmMedium,
    string? UtmCampaign,
    string? UtmTerm,
    string? UtmContent,
    string? LandingPage,
    string? Referrer,
    decimal? EstimatedValue,
    string? LostReason,
    DateTimeOffset CreatedOnUtc,
    DateTimeOffset? LastModifiedOnUtc,
    int NoteCount);
