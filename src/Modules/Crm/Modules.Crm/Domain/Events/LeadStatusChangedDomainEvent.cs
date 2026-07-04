using FSH.Framework.Core.Domain;
using FSH.Modules.Crm.Contracts.Dtos;

namespace FSH.Modules.Crm.Domain.Events;

public sealed record LeadStatusChangedDomainEvent(
    Guid LeadId,
    LeadStatus PreviousStatus,
    LeadStatus NewStatus,
    Guid EventId,
    DateTimeOffset OccurredOnUtc) : DomainEvent(EventId, OccurredOnUtc);
