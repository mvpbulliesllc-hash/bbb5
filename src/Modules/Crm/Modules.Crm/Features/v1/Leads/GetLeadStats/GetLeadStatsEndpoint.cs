using FSH.Framework.Shared.Identity.Authorization;
using FSH.Modules.Crm.Contracts.Authorization;
using FSH.Modules.Crm.Contracts.v1.Leads;
using Mediator;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace FSH.Modules.Crm.Features.v1.Leads.GetLeadStats;

public static class GetLeadStatsEndpoint
{
    internal static RouteHandlerBuilder MapGetLeadStatsEndpoint(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapGet("/crm/leads/stats",
                async (IMediator mediator, CancellationToken ct) =>
                    Results.Ok(await mediator.Send(new GetLeadStatsQuery(), ct)))
            .WithName("GetLeadStats")
            .WithSummary("Get lead pipeline analytics")
            .RequirePermission(CrmPermissions.Leads.View);
    }
}
