using FSH.Framework.Shared.Identity.Authorization;
using FSH.Modules.Crm.Contracts.Authorization;
using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;
using Mediator;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace FSH.Modules.Crm.Features.v1.Leads.SearchLeads;

public static class SearchLeadsEndpoint
{
    internal static RouteHandlerBuilder MapSearchLeadsEndpoint(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapGet("/crm/leads",
                async (
                    string? search,
                    LeadStatus? status,
                    ServiceType? serviceType,
                    LeadSource? source,
                    string? city,
                    DateTimeOffset? capturedFrom,
                    DateTimeOffset? capturedTo,
                    int? pageNumber,
                    int? pageSize,
                    string? sortBy,
                    string? sortDir,
                    IMediator mediator,
                    CancellationToken ct) =>
                {
                    var query = new SearchLeadsQuery
                    {
                        Search = search,
                        Status = status,
                        ServiceType = serviceType,
                        Source = source,
                        City = city,
                        CapturedFrom = capturedFrom,
                        CapturedTo = capturedTo,
                        PageNumber = pageNumber ?? 1,
                        PageSize = pageSize ?? 20,
                        SortBy = sortBy,
                        SortDir = sortDir,
                    };
                    return Results.Ok(await mediator.Send(query, ct));
                })
            .WithName("SearchLeads")
            .WithSummary("Search leads")
            .RequirePermission(CrmPermissions.Leads.View);
    }
}
