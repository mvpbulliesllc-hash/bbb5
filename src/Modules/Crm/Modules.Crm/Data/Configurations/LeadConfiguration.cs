using FSH.Modules.Crm.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FSH.Modules.Crm.Data.Configurations;

public sealed class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);
        builder.ToTable("Leads");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FirstName).IsRequired().HasMaxLength(64);
        builder.Property(x => x.LastName).IsRequired().HasMaxLength(64);
        builder.Property(x => x.Email).IsRequired().HasMaxLength(256);
        builder.Property(x => x.Phone).IsRequired().HasMaxLength(32);
        builder.Property(x => x.Address).HasMaxLength(256);
        builder.Property(x => x.City).HasMaxLength(96);
        builder.Property(x => x.ZipCode).HasMaxLength(16);
        builder.Property(x => x.Message).HasMaxLength(4096);
        builder.Property(x => x.LostReason).HasMaxLength(1024);

        builder.Property(x => x.UtmSource).HasMaxLength(256);
        builder.Property(x => x.UtmMedium).HasMaxLength(256);
        builder.Property(x => x.UtmCampaign).HasMaxLength(256);
        builder.Property(x => x.UtmTerm).HasMaxLength(256);
        builder.Property(x => x.UtmContent).HasMaxLength(256);
        builder.Property(x => x.LandingPage).HasMaxLength(2048);
        builder.Property(x => x.Referrer).HasMaxLength(2048);

        builder.Property(x => x.ServiceType).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.PreferredContactMethod).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Source).HasConversion<string>().HasMaxLength(32);

        builder.Property(x => x.EstimatedValue).HasPrecision(14, 2);

        builder.Property(x => x.CreatedBy).HasMaxLength(64);
        builder.Property(x => x.LastModifiedBy).HasMaxLength(64);

        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Source);
        builder.HasIndex(x => x.ServiceType);
        builder.HasIndex(x => x.City);
        builder.HasIndex(x => x.Email);
        builder.HasIndex(x => x.CreatedOnUtc);

        builder.HasMany(x => x.Notes)
            .WithOne()
            .HasForeignKey(n => n.LeadId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(x => x.DomainEvents);
    }
}
