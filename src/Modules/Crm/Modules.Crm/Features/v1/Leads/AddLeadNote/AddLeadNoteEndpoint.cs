using FSH.Framework.Shared.Identity.Authorization;
using FSH.Framework.Web.Idempotency;
using FSH.Modules.Crm.Contracts.Authorization;
using FSH.Modules.Crm.Contracts.v1.Leads;
using Mediator;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace FSH.Modules.Crm.Features.v1.Leads.AddLeadNote;

public static class AddLeadNoteEndpoint
{
    public sealed record AddLeadNoteRequest(string Body);

    internal static RouteHandlerBuilder MapAddLeadNoteEndpoint(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapPost("/crm/leads/{leadId:guid}/notes",
                async (Guid leadId, AddLeadNoteRequest body, IMediator mediator, CancellationToken ct) =>
                    Results.Ok(await mediator.Send(new AddLeadNoteCommand(leadId, body.Body), ct)))
            .WithName("AddLeadNote")
            .WithSummary("Add a note to a lead")
            .RequirePermission(CrmPermissions.Leads.Note)
            .WithIdempotency();
    }
}
