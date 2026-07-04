using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Features.v1.Leads.UpdateLead;

namespace Crm.Tests.Validators;

public sealed class UpdateLeadCommandValidatorTests
{
    private readonly UpdateLeadCommandValidator _sut = new();

    private static UpdateLeadCommand ValidCommand() => new(
        LeadId: Guid.NewGuid(),
        FirstName: "Jane",
        LastName: "Homeowner",
        Email: "jane@example.com",
        Phone: "262-555-0100",
        ServiceType: ServiceType.Siding,
        PreferredContactMethod: ContactMethod.Email,
        City: "Waukesha",
        EstimatedValue: 12000m);

    #region Happy Path

    [Fact]
    public void Validate_Should_Pass_When_CommandIsValid()
    {
        // Act / Assert
        _sut.Validate(ValidCommand()).IsValid.ShouldBeTrue();
    }

    #endregion

    #region Exception

    [Fact]
    public void Validate_Should_Fail_When_LeadIdIsEmpty()
    {
        // Arrange
        var command = ValidCommand() with { LeadId = Guid.Empty };

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(UpdateLeadCommand.LeadId));
    }

    [Fact]
    public void Validate_Should_Fail_When_EmailIsMalformed()
    {
        // Arrange
        var command = ValidCommand() with { Email = "nope" };

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(UpdateLeadCommand.Email));
    }

    [Fact]
    public void Validate_Should_Fail_When_EstimatedValueIsNegative()
    {
        // Arrange
        var command = ValidCommand() with { EstimatedValue = -500m };

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(UpdateLeadCommand.EstimatedValue));
    }

    #endregion
}
