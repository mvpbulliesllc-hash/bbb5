using FSH.Framework.Core.Domain;

namespace FSH.Modules.Crm.Domain.Events;

public sealed record LeadNoteAddedDomainEvent(
    Guid LeadId,
    Guid NoteId,
    Guid EventId,
    DateTimeOffset OccurredOnUtc) : DomainEvent(EventId, OccurredOnUtc);
