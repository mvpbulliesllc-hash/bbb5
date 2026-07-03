using FSH.Framework.Core.Domain;
using FSH.Modules.Crm.Contracts.Dtos;

namespace FSH.Modules.Crm.Domain.Events;

public sealed record LeadCapturedDomainEvent(
    Guid LeadId,
    LeadSource Source,
    ServiceType ServiceType,
    Guid EventId,
    DateTimeOffset OccurredOnUtc) : DomainEvent(EventId, OccurredOnUtc);
