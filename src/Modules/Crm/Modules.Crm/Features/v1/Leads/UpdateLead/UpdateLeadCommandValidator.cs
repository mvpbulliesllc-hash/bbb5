using FluentValidation;
using FSH.Modules.Crm.Contracts.v1.Leads;

namespace FSH.Modules.Crm.Features.v1.Leads.UpdateLead;

public sealed class UpdateLeadCommandValidator : AbstractValidator<UpdateLeadCommand>
{
    public UpdateLeadCommandValidator()
    {
        RuleFor(x => x.LeadId).NotEmpty();
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(64);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(32);
        RuleFor(x => x.ServiceType).IsInEnum();
        RuleFor(x => x.PreferredContactMethod).IsInEnum();
        RuleFor(x => x.Address).MaximumLength(256);
        RuleFor(x => x.City).MaximumLength(96);
        RuleFor(x => x.ZipCode).MaximumLength(16);
        RuleFor(x => x.Message).MaximumLength(4096);
        RuleFor(x => x.EstimatedValue)
            .GreaterThanOrEqualTo(0)
            .When(x => x.EstimatedValue is not null);
    }
}
