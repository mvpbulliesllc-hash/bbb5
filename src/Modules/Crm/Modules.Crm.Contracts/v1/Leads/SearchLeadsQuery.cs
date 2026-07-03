using FSH.Framework.Shared.Persistence;
using FSH.Modules.Crm.Contracts.Dtos;
using Mediator;

namespace FSH.Modules.Crm.Contracts.v1.Leads;

public sealed record SearchLeadsQuery : IQuery<PagedResponse<LeadDto>>
{
    public string? Search { get; init; }
    public LeadStatus? Status { get; init; }
    public ServiceType? ServiceType { get; init; }
    public LeadSource? Source { get; init; }
    public string? City { get; init; }
    public DateTimeOffset? CapturedFrom { get; init; }
    public DateTimeOffset? CapturedTo { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? SortBy { get; init; }
    public string? SortDir { get; init; }
}
