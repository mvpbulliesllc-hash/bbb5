using FSH.Modules.Crm.Contracts.Dtos;
using Mediator;

namespace FSH.Modules.Crm.Contracts.v1.Leads;

/// <summary>
/// Moves a lead through the pipeline. <paramref name="LostReason"/> is
/// required when moving to Lost; <paramref name="EstimatedValue"/> lets
/// the operator set/refresh the job value while transitioning (e.g. when
/// the estimate goes out or the job is won).
/// </summary>
public sealed record UpdateLeadStatusCommand(
    Guid LeadId,
    LeadStatus Status,
    string? LostReason = null,
    decimal? EstimatedValue = null) : ICommand<Guid>;
