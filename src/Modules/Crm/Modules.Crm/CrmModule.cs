using Asp.Versioning;
using FSH.Framework.Persistence;
using FSH.Framework.Shared.Constants;
using FSH.Framework.Web.Modules;
using FSH.Modules.Crm.Contracts.Authorization;
using FSH.Modules.Crm.Data;
using FSH.Modules.Crm.Features.v1.Leads.AddLeadNote;
using FSH.Modules.Crm.Features.v1.Leads.CaptureLead;
using FSH.Modules.Crm.Features.v1.Leads.GetLead;
using FSH.Modules.Crm.Features.v1.Leads.GetLeadStats;
using FSH.Modules.Crm.Features.v1.Leads.ListLeadNotes;
using FSH.Modules.Crm.Features.v1.Leads.SearchLeads;
using FSH.Modules.Crm.Features.v1.Leads.UpdateLead;
using FSH.Modules.Crm.Features.v1.Leads.UpdateLeadStatus;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

[assembly: FshModule(typeof(FSH.Modules.Crm.CrmModule), 850)]

namespace FSH.Modules.Crm;

public sealed class CrmModule : IModule
{
    public void ConfigureServices(IHostApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        PermissionConstants.Register(CrmPermissions.All);

        builder.Services.AddHeroDbContext<CrmDbContext>();
        builder.Services.AddScoped<IDbInitializer, CrmDbInitializer>();

        builder.Services.AddHealthChecks()
            .AddDbContextCheck<CrmDbContext>(
                name: "db:crm",
                failureStatus: HealthStatus.Unhealthy);
    }

    public void ConfigureMiddleware(IApplicationBuilder app)
    {
        // No custom middleware needed
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        var versionSet = endpoints.NewApiVersionSet()
            .HasApiVersion(new ApiVersion(1))
            .ReportApiVersions()
            .Build();

        var group = endpoints
            .MapGroup("api/v{version:apiVersion}")
            .WithTags("CRM")
            .WithApiVersionSet(versionSet)
            .RequireAuthorization();

        // Stats + note routes register before the catch-all `{leadId:guid}` GET so literal
        // segments win — minimal APIs match the first compatible pattern, so order matters.
        group.MapGetLeadStatsEndpoint();
        group.MapAddLeadNoteEndpoint();
        group.MapListLeadNotesEndpoint();
        group.MapUpdateLeadStatusEndpoint();

        group.MapCaptureLeadEndpoint();
        group.MapSearchLeadsEndpoint();
        group.MapUpdateLeadEndpoint();
        group.MapGetLeadEndpoint();
    }
}
