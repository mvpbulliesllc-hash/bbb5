using FSH.Modules.Crm.Contracts.Dtos;

namespace FSH.Modules.Crm.Domain;

internal static class LeadMappings
{
    public static LeadDto ToDto(this Lead l, int noteCount) => new(
        l.Id,
        l.FirstName,
        l.LastName,
        l.Email,
        l.Phone,
        l.Address,
        l.City,
        l.ZipCode,
        l.ServiceType,
        l.Message,
        l.PreferredContactMethod,
        l.Status,
        l.Source,
        l.UtmSource,
        l.UtmMedium,
        l.UtmCampaign,
        l.UtmTerm,
        l.UtmContent,
        l.LandingPage,
        l.Referrer,
        l.EstimatedValue,
        l.LostReason,
        l.CreatedOnUtc,
        l.LastModifiedOnUtc,
        noteCount);

    public static LeadNoteDto ToDto(this LeadNote n) => new(
        n.Id, n.LeadId, n.Body, n.CreatedBy, n.CreatedOnUtc);
}
