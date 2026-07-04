using FSH.Framework.Shared.Identity.Authorization;
using FSH.Framework.Web.Idempotency;
using FSH.Modules.Crm.Contracts.Authorization;
using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;
using Mediator;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace FSH.Modules.Crm.Features.v1.Leads.UpdateLead;

public static class UpdateLeadEndpoint
{
    public sealed record UpdateLeadRequest(
        string FirstName,
        string LastName,
        string Email,
        string Phone,
        ServiceType ServiceType,
        ContactMethod PreferredContactMethod,
        string? Address,
        string? City,
        string? ZipCode,
        string? Message,
        decimal? EstimatedValue);

    internal static RouteHandlerBuilder MapUpdateLeadEndpoint(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapPut("/crm/leads/{leadId:guid}",
                async (Guid leadId, UpdateLeadRequest body, IMediator mediator, CancellationToken ct) =>
                    Results.Ok(await mediator.Send(
                        new UpdateLeadCommand(
                            leadId, body.FirstName, body.LastName, body.Email, body.Phone,
                            body.ServiceType, body.PreferredContactMethod, body.Address, body.City,
                            body.ZipCode, body.Message, body.EstimatedValue), ct)))
            .WithName("UpdateLead")
            .WithSummary("Edit a lead's contact and job details")
            .RequirePermission(CrmPermissions.Leads.Update)
            .WithIdempotency();
    }
}
