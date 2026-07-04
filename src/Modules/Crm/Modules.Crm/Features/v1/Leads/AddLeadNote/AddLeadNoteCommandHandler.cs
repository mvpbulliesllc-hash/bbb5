using FSH.Framework.Core.Exceptions;
using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace FSH.Modules.Crm.Features.v1.Leads.AddLeadNote;

public sealed class AddLeadNoteCommandHandler(CrmDbContext dbContext)
    : ICommandHandler<AddLeadNoteCommand, Guid>
{
    public async ValueTask<Guid> Handle(AddLeadNoteCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        // Load the Notes collection up front so EF's change tracker detects the new LeadNote
        // (added via the aggregate) as an INSERT rather than missing it during change detection.
        var lead = await dbContext.Leads
            .Include(l => l.Notes)
            .FirstOrDefaultAsync(l => l.Id == command.LeadId, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException($"Lead {command.LeadId} not found.");

        var noteId = lead.AddNote(command.Body);
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return noteId;
    }
}
