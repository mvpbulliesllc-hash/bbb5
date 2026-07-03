using FluentValidation;
using FSH.Modules.Crm.Contracts.v1.Leads;

namespace FSH.Modules.Crm.Features.v1.Leads.SearchLeads;

public sealed class SearchLeadsQueryValidator : AbstractValidator<SearchLeadsQuery>
{
    public SearchLeadsQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 200);
        RuleFor(x => x.Search).MaximumLength(256);
        RuleFor(x => x.City).MaximumLength(96);
        RuleFor(x => x.CapturedTo)
            .GreaterThanOrEqualTo(x => x.CapturedFrom!.Value)
            .When(x => x.CapturedFrom is not null && x.CapturedTo is not null)
            .WithMessage("'CapturedTo' must be on or after 'CapturedFrom'.");
    }
}
