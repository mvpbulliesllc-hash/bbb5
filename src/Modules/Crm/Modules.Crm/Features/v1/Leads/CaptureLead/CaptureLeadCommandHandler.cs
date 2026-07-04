using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Data;
using FSH.Modules.Crm.Domain;
using Mediator;

namespace FSH.Modules.Crm.Features.v1.Leads.CaptureLead;

public sealed class CaptureLeadCommandHandler(CrmDbContext dbContext)
    : ICommandHandler<CaptureLeadCommand, Guid>
{
    public async ValueTask<Guid> Handle(CaptureLeadCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var lead = Lead.Capture(
            firstName: command.FirstName,
            lastName: command.LastName,
            email: command.Email,
            phone: command.Phone,
            serviceType: command.ServiceType,
            preferredContactMethod: command.PreferredContactMethod,
            source: command.Source,
            address: command.Address,
            city: command.City,
            zipCode: command.ZipCode,
            message: command.Message,
            utmSource: command.UtmSource,
            utmMedium: command.UtmMedium,
            utmCampaign: command.UtmCampaign,
            utmTerm: command.UtmTerm,
            utmContent: command.UtmContent,
            landingPage: command.LandingPage,
            referrer: command.Referrer);

        dbContext.Leads.Add(lead);
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return lead.Id;
    }
}
