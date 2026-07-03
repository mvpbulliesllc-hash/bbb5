using FSH.Framework.Shared.Identity.Authorization;
using FSH.Modules.Crm.Contracts.Authorization;
using FSH.Modules.Crm.Contracts.v1.Leads;
using Mediator;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace FSH.Modules.Crm.Features.v1.Leads.GetLead;

public static class GetLeadEndpoint
{
    internal static RouteHandlerBuilder MapGetLeadEndpoint(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapGet("/crm/leads/{leadId:guid}",
                async (Guid leadId, IMediator mediator, CancellationToken ct) =>
                    Results.Ok(await mediator.Send(new GetLeadQuery(leadId), ct)))
            .WithName("GetLead")
            .WithSummary("Get a lead by id")
            .RequirePermission(CrmPermissions.Leads.View);
    }
}
