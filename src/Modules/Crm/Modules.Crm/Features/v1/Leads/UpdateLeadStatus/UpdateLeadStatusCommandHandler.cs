using FSH.Framework.Core.Exceptions;
using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace FSH.Modules.Crm.Features.v1.Leads.UpdateLeadStatus;

public sealed class UpdateLeadStatusCommandHandler(CrmDbContext dbContext)
    : ICommandHandler<UpdateLeadStatusCommand, Guid>
{
    public async ValueTask<Guid> Handle(UpdateLeadStatusCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var lead = await dbContext.Leads
            .FirstOrDefaultAsync(l => l.Id == command.LeadId, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException($"Lead {command.LeadId} not found.");

        lead.ChangeStatus(command.Status, command.LostReason, command.EstimatedValue);

        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return lead.Id;
    }
}
