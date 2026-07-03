using FSH.Framework.Core.Exceptions;
using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Data;
using FSH.Modules.Crm.Domain;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace FSH.Modules.Crm.Features.v1.Leads.GetLead;

public sealed class GetLeadQueryHandler(CrmDbContext dbContext)
    : IQueryHandler<GetLeadQuery, LeadDto>
{
    public async ValueTask<LeadDto> Handle(GetLeadQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var lead = await dbContext.Leads
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == query.LeadId, cancellationToken)
            .ConfigureAwait(false);

        if (lead is null)
        {
            throw new NotFoundException($"Lead {query.LeadId} not found.");
        }

        int noteCount = await dbContext.LeadNotes
            .CountAsync(n => n.LeadId == lead.Id, cancellationToken)
            .ConfigureAwait(false);

        return lead.ToDto(noteCount);
    }
}
