using FluentValidation;
using FSH.Modules.Crm.Contracts.v1.Leads;

namespace FSH.Modules.Crm.Features.v1.Leads.AddLeadNote;

public sealed class AddLeadNoteCommandValidator : AbstractValidator<AddLeadNoteCommand>
{
    public AddLeadNoteCommandValidator()
    {
        RuleFor(x => x.LeadId).NotEmpty();
        RuleFor(x => x.Body).NotEmpty().MaximumLength(4096);
    }
}
