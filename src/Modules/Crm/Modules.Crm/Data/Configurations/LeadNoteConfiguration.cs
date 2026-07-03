using FSH.Modules.Crm.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FSH.Modules.Crm.Data.Configurations;

public sealed class LeadNoteConfiguration : IEntityTypeConfiguration<LeadNote>
{
    public void Configure(EntityTypeBuilder<LeadNote> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);
        builder.ToTable("LeadNotes");
        builder.HasKey(x => x.Id);

        // Id is app-assigned (Guid.CreateVersion7) and notes attach only via the Lead aggregate's nav
        // collection. Without ValueGeneratedNever, EF tracks the populated Guid as Modified → UPDATE-0-rows.
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.Body).IsRequired().HasMaxLength(4096);
        builder.Property(x => x.CreatedBy).HasMaxLength(64);
        builder.Property(x => x.LastModifiedBy).HasMaxLength(64);
        builder.HasIndex(x => x.LeadId);
        builder.Ignore(x => x.DomainEvents);
    }
}
