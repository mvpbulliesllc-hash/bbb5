using FSH.Modules.Crm.Contracts.Dtos;
using Mediator;

namespace FSH.Modules.Crm.Contracts.v1.Leads;

/// <summary>
/// Edits a lead's contact/job details. Marketing attribution (UTM fields)
/// is immutable capture metadata, and pipeline status has its own command.
/// </summary>
public sealed record UpdateLeadCommand(
    Guid LeadId,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    ServiceType ServiceType,
    ContactMethod PreferredContactMethod,
    string? Address = null,
    string? City = null,
    string? ZipCode = null,
    string? Message = null,
    decimal? EstimatedValue = null) : ICommand<Guid>;
