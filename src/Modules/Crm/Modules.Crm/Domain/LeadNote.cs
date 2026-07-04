using FSH.Framework.Core.Domain;

namespace FSH.Modules.Crm.Domain;

/// <summary>
/// A note posted on a lead. Created via Lead.AddNote so the parent
/// aggregate stays the consistency boundary — notes are never persisted
/// independently. CreatedBy/CreatedOnUtc are stamped by the persistence
/// auditing interceptor at save time.
/// </summary>
public sealed class LeadNote : BaseEntity<Guid>, IAuditableEntity
{
    public Guid LeadId { get; private set; }
    public string Body { get; private set; } = default!;

    // Setters are populated by AuditableEntitySaveChangesInterceptor via EF Core's
    // entry.Property(...).CurrentValue — invisible to static analysis.
#pragma warning disable S1144 // EF Core writes these setters via reflection
    public DateTimeOffset CreatedOnUtc { get; private set; }
    public string? CreatedBy { get; private set; }
    public DateTimeOffset? LastModifiedOnUtc { get; private set; }
    public string? LastModifiedBy { get; private set; }
#pragma warning restore S1144

    private LeadNote() { }

    internal static LeadNote Create(Guid leadId, string body)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(body);

        return new LeadNote
        {
            Id = Guid.CreateVersion7(),
            LeadId = leadId,
            Body = body.Trim(),
            CreatedOnUtc = DateTimeOffset.UtcNow,
        };
    }
}
