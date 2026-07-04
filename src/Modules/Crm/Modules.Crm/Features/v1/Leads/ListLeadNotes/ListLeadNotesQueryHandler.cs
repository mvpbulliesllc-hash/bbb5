using FSH.Framework.Core.Exceptions;
using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Data;
using FSH.Modules.Crm.Domain;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace FSH.Modules.Crm.Features.v1.Leads.ListLeadNotes;

public sealed class ListLeadNotesQueryHandler(CrmDbContext dbContext)
    : IQueryHandler<ListLeadNotesQuery, IReadOnlyList<LeadNoteDto>>
{
    public async ValueTask<IReadOnlyList<LeadNoteDto>> Handle(ListLeadNotesQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        bool leadExists = await dbContext.Leads
            .AnyAsync(l => l.Id == query.LeadId, cancellationToken)
            .ConfigureAwait(false);

        if (!leadExists)
        {
            throw new NotFoundException($"Lead {query.LeadId} not found.");
        }

        var notes = await dbContext.LeadNotes
            .AsNoTracking()
            .Where(n => n.LeadId == query.LeadId)
            .OrderByDescending(n => n.CreatedOnUtc)
            .ThenByDescending(n => n.Id)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return notes.Select(n => n.ToDto()).ToList();
    }
}
