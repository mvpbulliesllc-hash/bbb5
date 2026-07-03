using FSH.Framework.Core.Domain;
using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Domain.Events;

namespace FSH.Modules.Crm.Domain;

/// <summary>
/// Lead aggregate — a homeowner (or business) asking Paragon Exteriors for
/// an estimate. Owns its note collection and the pipeline status, and
/// carries the marketing attribution (UTM fields) of the visit that
/// converted. Audit stamps (CreatedOnUtc/CreatedBy/LastModified*) are
/// populated by the persistence auditing interceptor.
/// </summary>
public sealed class Lead : AggregateRoot<Guid>, IAuditableEntity
{
    private readonly List<LeadNote> _notes = [];

    public string FirstName { get; private set; } = default!;
    public string LastName { get; private set; } = default!;
    public string Email { get; private set; } = default!;
    public string Phone { get; private set; } = default!;
    public string? Address { get; private set; }
    public string? City { get; private set; }
    public string? ZipCode { get; private set; }
    public ServiceType ServiceType { get; private set; }
    public string? Message { get; private set; }
    public ContactMethod PreferredContactMethod { get; private set; }
    public LeadStatus Status { get; private set; }
    public LeadSource Source { get; private set; }

    // Marketing attribution — immutable capture metadata.
    public string? UtmSource { get; private set; }
    public string? UtmMedium { get; private set; }
    public string? UtmCampaign { get; private set; }
    public string? UtmTerm { get; private set; }
    public string? UtmContent { get; private set; }
    public string? LandingPage { get; private set; }
    public string? Referrer { get; private set; }

    public decimal? EstimatedValue { get; private set; }
    public string? LostReason { get; private set; }

    // Setters are populated by AuditableEntitySaveChangesInterceptor via EF Core's
    // entry.Property(...).CurrentValue — invisible to static analysis.
#pragma warning disable S1144 // EF Core writes these setters via reflection
    public DateTimeOffset CreatedOnUtc { get; private set; }
    public string? CreatedBy { get; private set; }
    public DateTimeOffset? LastModifiedOnUtc { get; private set; }
    public string? LastModifiedBy { get; private set; }
#pragma warning restore S1144

    public IReadOnlyCollection<LeadNote> Notes => _notes.AsReadOnly();

    private Lead() { }

    public static Lead Capture(
        string firstName,
        string lastName,
        string email,
        string phone,
        ServiceType serviceType,
        ContactMethod preferredContactMethod,
        LeadSource source,
        string? address = null,
        string? city = null,
        string? zipCode = null,
        string? message = null,
        string? utmSource = null,
        string? utmMedium = null,
        string? utmCampaign = null,
        string? utmTerm = null,
        string? utmContent = null,
        string? landingPage = null,
        string? referrer = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(firstName);
        ArgumentException.ThrowIfNullOrWhiteSpace(lastName);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);

        var lead = new Lead
        {
            Id = Guid.CreateVersion7(),
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Email = email.Trim(),
            Phone = phone.Trim(),
            Address = Normalize(address),
            City = Normalize(city),
            ZipCode = Normalize(zipCode),
            ServiceType = serviceType,
            Message = Normalize(message),
            PreferredContactMethod = preferredContactMethod,
            Status = LeadStatus.New,
            Source = source,
            UtmSource = Normalize(utmSource),
            UtmMedium = Normalize(utmMedium),
            UtmCampaign = Normalize(utmCampaign),
            UtmTerm = Normalize(utmTerm),
            UtmContent = Normalize(utmContent),
            LandingPage = Normalize(landingPage),
            Referrer = Normalize(referrer),
            CreatedOnUtc = DateTimeOffset.UtcNow,
        };

        lead.AddDomainEvent(DomainEvent.Create<LeadCapturedDomainEvent>(
            (id, ts) => new LeadCapturedDomainEvent(lead.Id, lead.Source, lead.ServiceType, id, ts)));

        return lead;
    }

    /// <summary>
    /// Edits the contact/job details. Marketing attribution and pipeline
    /// status are deliberately untouched — status moves via <see cref="ChangeStatus"/>.
    /// </summary>
    public void UpdateDetails(
        string firstName,
        string lastName,
        string email,
        string phone,
        ServiceType serviceType,
        ContactMethod preferredContactMethod,
        string? address,
        string? city,
        string? zipCode,
        string? message,
        decimal? estimatedValue)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(firstName);
        ArgumentException.ThrowIfNullOrWhiteSpace(lastName);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);

        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Email = email.Trim();
        Phone = phone.Trim();
        ServiceType = serviceType;
        PreferredContactMethod = preferredContactMethod;
        Address = Normalize(address);
        City = Normalize(city);
        ZipCode = Normalize(zipCode);
        Message = Normalize(message);
        EstimatedValue = estimatedValue;
    }

    /// <summary>
    /// Moves the lead through the pipeline. Any transition is allowed (a
    /// roofing office reopens "lost" jobs after storms), but the state stays
    /// coherent: LostReason only survives while the lead is Lost, and an
    /// EstimatedValue passed alongside the transition updates the job value.
    /// Same-status calls are no-ops (no event raised).
    /// </summary>
    public void ChangeStatus(LeadStatus newStatus, string? lostReason = null, decimal? estimatedValue = null)
    {
        if (estimatedValue is not null)
        {
            EstimatedValue = estimatedValue;
        }

        if (newStatus == Status)
        {
            // Allow refreshing the lost reason without a transition.
            if (Status == LeadStatus.Lost && lostReason is not null)
            {
                LostReason = Normalize(lostReason);
            }
            return;
        }

        LostReason = newStatus == LeadStatus.Lost ? Normalize(lostReason) : null;

        var previous = Status;
        Status = newStatus;

        AddDomainEvent(DomainEvent.Create<LeadStatusChangedDomainEvent>(
            (id, ts) => new LeadStatusChangedDomainEvent(Id, previous, newStatus, id, ts)));
    }

    public Guid AddNote(string body)
    {
        var note = LeadNote.Create(Id, body);
        _notes.Add(note);

        AddDomainEvent(DomainEvent.Create<LeadNoteAddedDomainEvent>(
            (id, ts) => new LeadNoteAddedDomainEvent(Id, note.Id, id, ts)));

        return note.Id;
    }

    private static string? Normalize(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
