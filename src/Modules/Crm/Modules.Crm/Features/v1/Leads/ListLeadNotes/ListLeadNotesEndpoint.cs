using FSH.Framework.Shared.Identity.Authorization;
using FSH.Modules.Crm.Contracts.Authorization;
using FSH.Modules.Crm.Contracts.v1.Leads;
using Mediator;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace FSH.Modules.Crm.Features.v1.Leads.ListLeadNotes;

public static class ListLeadNotesEndpoint
{
    internal static RouteHandlerBuilder MapListLeadNotesEndpoint(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapGet("/crm/leads/{leadId:guid}/notes",
                async (Guid leadId, IMediator mediator, CancellationToken ct) =>
                    Results.Ok(await mediator.Send(new ListLeadNotesQuery(leadId), ct)))
            .WithName("ListLeadNotes")
            .WithSummary("List the notes on a lead")
            .RequirePermission(CrmPermissions.Leads.View);
    }
}
