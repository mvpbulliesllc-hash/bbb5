using FSH.Framework.Shared.Identity.Authorization;
using FSH.Framework.Web.Idempotency;
using FSH.Modules.Crm.Contracts.Authorization;
using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;
using Mediator;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace FSH.Modules.Crm.Features.v1.Leads.UpdateLeadStatus;

public static class UpdateLeadStatusEndpoint
{
    public sealed record UpdateLeadStatusRequest(
        LeadStatus Status,
        string? LostReason,
        decimal? EstimatedValue);

    internal static RouteHandlerBuilder MapUpdateLeadStatusEndpoint(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapPut("/crm/leads/{leadId:guid}/status",
                async (Guid leadId, UpdateLeadStatusRequest body, IMediator mediator, CancellationToken ct) =>
                    Results.Ok(await mediator.Send(
                        new UpdateLeadStatusCommand(leadId, body.Status, body.LostReason, body.EstimatedValue), ct)))
            .WithName("UpdateLeadStatus")
            .WithSummary("Move a lead through the pipeline")
            .RequirePermission(CrmPermissions.Leads.UpdateStatus)
            .WithIdempotency();
    }
}
