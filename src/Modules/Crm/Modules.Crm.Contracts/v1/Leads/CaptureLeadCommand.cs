using FSH.Modules.Crm.Contracts.Dtos;
using Mediator;

namespace FSH.Modules.Crm.Contracts.v1.Leads;

/// <summary>
/// Captures a new lead. Submitted by the public marketing site (anonymous)
/// as well as operators logging phone/referral leads by hand — the UTM
/// fields carry the marketing attribution of the visit that converted.
/// </summary>
public sealed record CaptureLeadCommand(
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    ServiceType ServiceType,
    ContactMethod PreferredContactMethod = ContactMethod.Phone,
    LeadSource Source = LeadSource.Website,
    string? Address = null,
    string? City = null,
    string? ZipCode = null,
    string? Message = null,
    string? UtmSource = null,
    string? UtmMedium = null,
    string? UtmCampaign = null,
    string? UtmTerm = null,
    string? UtmContent = null,
    string? LandingPage = null,
    string? Referrer = null) : ICommand<Guid>;
