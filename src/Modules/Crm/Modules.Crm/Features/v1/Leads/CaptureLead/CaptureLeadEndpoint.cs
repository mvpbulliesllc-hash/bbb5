using FSH.Framework.Shared.Multitenancy;
using FSH.Framework.Web.Idempotency;
using FSH.Modules.Crm.Contracts.v1.Leads;
using Mediator;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace FSH.Modules.Crm.Features.v1.Leads.CaptureLead;

public static class CaptureLeadEndpoint
{
    internal static RouteHandlerBuilder MapCaptureLeadEndpoint(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapPost("/crm/leads",
                async (CaptureLeadCommand command,
                    [FromHeader(Name = MultitenancyConstants.Identifier)] string tenant,
                    IMediator mediator,
                    CancellationToken ct) =>
                {
                    var leadId = await mediator.Send(command, ct);
                    return TypedResults.Created($"/api/v1/crm/leads/{leadId}", leadId);
                })
            .WithName("CaptureLead")
            .WithSummary("Capture a lead")
            .WithDescription("Captures a lead from the public marketing site. Anonymous; tenant identified via the tenant header.")
            .AllowAnonymous()
            .RequireRateLimiting("auth")
            .WithIdempotency()
            .Produces<Guid>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest);
    }
}
