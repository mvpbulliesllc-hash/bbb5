using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Features.v1.Leads.AddLeadNote;

namespace Crm.Tests.Validators;

public sealed class AddLeadNoteCommandValidatorTests
{
    private readonly AddLeadNoteCommandValidator _sut = new();

    #region Happy Path

    [Fact]
    public void Validate_Should_Pass_When_CommandIsValid()
    {
        // Act
        var result = _sut.Validate(new AddLeadNoteCommand(Guid.NewGuid(), "Estimate booked."));

        // Assert
        result.IsValid.ShouldBeTrue();
    }

    #endregion

    #region Exception

    [Fact]
    public void Validate_Should_Fail_When_BodyIsEmpty()
    {
        // Act
        var result = _sut.Validate(new AddLeadNoteCommand(Guid.NewGuid(), ""));

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(AddLeadNoteCommand.Body));
    }

    [Fact]
    public void Validate_Should_Fail_When_BodyExceedsMaxLength()
    {
        // Act
        var result = _sut.Validate(new AddLeadNoteCommand(Guid.NewGuid(), new string('x', 4097)));

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(AddLeadNoteCommand.Body));
    }

    [Fact]
    public void Validate_Should_Fail_When_LeadIdIsEmpty()
    {
        // Act
        var result = _sut.Validate(new AddLeadNoteCommand(Guid.Empty, "Body"));

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(AddLeadNoteCommand.LeadId));
    }

    #endregion
}
