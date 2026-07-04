using FluentValidation;
using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;

namespace FSH.Modules.Crm.Features.v1.Leads.UpdateLeadStatus;

public sealed class UpdateLeadStatusCommandValidator : AbstractValidator<UpdateLeadStatusCommand>
{
    public UpdateLeadStatusCommandValidator()
    {
        RuleFor(x => x.LeadId).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.LostReason)
            .NotEmpty()
            .When(x => x.Status == LeadStatus.Lost)
            .WithMessage("A lost reason is required when marking a lead as Lost.");
        RuleFor(x => x.LostReason).MaximumLength(1024);
        RuleFor(x => x.EstimatedValue)
            .GreaterThanOrEqualTo(0)
            .When(x => x.EstimatedValue is not null);
    }
}
