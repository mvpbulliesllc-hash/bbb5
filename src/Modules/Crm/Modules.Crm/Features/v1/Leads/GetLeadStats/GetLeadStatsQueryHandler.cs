using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace FSH.Modules.Crm.Features.v1.Leads.GetLeadStats;

public sealed class GetLeadStatsQueryHandler(CrmDbContext dbContext, TimeProvider timeProvider)
    : IQueryHandler<GetLeadStatsQuery, LeadStatsDto>
{
    public async ValueTask<LeadStatsDto> Handle(GetLeadStatsQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var nowUtc = timeProvider.GetUtcNow();

        var byStatus = await dbContext.Leads.AsNoTracking()
            .GroupBy(l => l.Status)
            .Select(g => new LeadStatusCountDto(g.Key, g.Count()))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var bySource = await dbContext.Leads.AsNoTracking()
            .GroupBy(l => l.Source)
            .Select(g => new LeadSourceCountDto(g.Key, g.Count()))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var byServiceType = await dbContext.Leads.AsNoTracking()
            .GroupBy(l => l.ServiceType)
            .Select(g => new LeadServiceTypeCountDto(g.Key, g.Count()))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        // Fetch only the capture timestamps inside the 12-week window and
        // bucket in memory — week alignment (Mondays) doesn't translate to SQL cleanly.
        var windowStartUtc = LeadStatsCalculator.WindowStartUtc(nowUtc);
        var capturedOn = await dbContext.Leads.AsNoTracking()
            .Where(l => l.CreatedOnUtc >= windowStartUtc)
            .Select(l => l.CreatedOnUtc)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        decimal pipelineValue = await dbContext.Leads.AsNoTracking()
            .Where(l => l.Status != LeadStatus.Won && l.Status != LeadStatus.Lost && l.EstimatedValue != null)
            .SumAsync(l => l.EstimatedValue, cancellationToken)
            .ConfigureAwait(false) ?? 0m;

        decimal wonValue = await dbContext.Leads.AsNoTracking()
            .Where(l => l.Status == LeadStatus.Won && l.EstimatedValue != null)
            .SumAsync(l => l.EstimatedValue, cancellationToken)
            .ConfigureAwait(false) ?? 0m;

        int won = byStatus.FirstOrDefault(s => s.Status == LeadStatus.Won)?.Count ?? 0;
        int lost = byStatus.FirstOrDefault(s => s.Status == LeadStatus.Lost)?.Count ?? 0;

        return new LeadStatsDto(
            TotalLeads: byStatus.Sum(s => s.Count),
            ByStatus: [.. byStatus.OrderBy(s => s.Status)],
            BySource: [.. bySource.OrderByDescending(s => s.Count)],
            ByServiceType: [.. byServiceType.OrderByDescending(s => s.Count)],
            LeadsPerWeek: LeadStatsCalculator.BuildWeeklyBuckets(capturedOn, nowUtc),
            ConversionRate: LeadStatsCalculator.ConversionRate(won, lost),
            PipelineValue: pipelineValue,
            WonValue: wonValue);
    }
}
