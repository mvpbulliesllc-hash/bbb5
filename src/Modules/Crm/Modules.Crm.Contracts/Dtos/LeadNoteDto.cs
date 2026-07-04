namespace FSH.Modules.Crm.Contracts.Dtos;

/// <summary>
/// A note posted on a lead by an operator (call summary, estimate detail, follow-up reminder).
/// </summary>
public sealed record LeadNoteDto(
    Guid Id,
    Guid LeadId,
    string Body,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc);
