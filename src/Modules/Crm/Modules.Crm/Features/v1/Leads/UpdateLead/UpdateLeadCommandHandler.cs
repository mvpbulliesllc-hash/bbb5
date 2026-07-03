using FSH.Framework.Core.Exceptions;
using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace FSH.Modules.Crm.Features.v1.Leads.UpdateLead;

public sealed class UpdateLeadCommandHandler(CrmDbContext dbContext)
    : ICommandHandler<UpdateLeadCommand, Guid>
{
    public async ValueTask<Guid> Handle(UpdateLeadCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var lead = await dbContext.Leads
            .FirstOrDefaultAsync(l => l.Id == command.LeadId, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException($"Lead {command.LeadId} not found.");

        lead.UpdateDetails(
            firstName: command.FirstName,
            lastName: command.LastName,
            email: command.Email,
            phone: command.Phone,
            serviceType: command.ServiceType,
            preferredContactMethod: command.PreferredContactMethod,
            address: command.Address,
            city: command.City,
            zipCode: command.ZipCode,
            message: command.Message,
            estimatedValue: command.EstimatedValue);

        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return lead.Id;
    }
}
