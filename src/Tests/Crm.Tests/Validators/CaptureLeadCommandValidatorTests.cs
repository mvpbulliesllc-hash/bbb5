using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Features.v1.Leads.CaptureLead;

namespace Crm.Tests.Validators;

public sealed class CaptureLeadCommandValidatorTests
{
    private readonly CaptureLeadCommandValidator _sut = new();

    private static CaptureLeadCommand ValidCommand() => new(
        FirstName: "Jane",
        LastName: "Homeowner",
        Email: "jane@example.com",
        Phone: "262-555-0100",
        ServiceType: ServiceType.RoofReplacement,
        PreferredContactMethod: ContactMethod.Phone,
        Source: LeadSource.Website,
        City: "Waukesha",
        UtmSource: "google",
        UtmCampaign: "storm-2026");

    #region Happy Path

    [Fact]
    public void Validate_Should_Pass_When_CommandIsValid()
    {
        // Act
        var result = _sut.Validate(ValidCommand());

        // Assert
        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public void Validate_Should_Pass_When_OptionalFieldsAreNull()
    {
        // Arrange
        var command = new CaptureLeadCommand(
            "Jane", "Homeowner", "jane@example.com", "262-555-0100", ServiceType.Other);

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeTrue();
    }

    #endregion

    #region Required Fields

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_Should_Fail_When_FirstNameIsBlank(string firstName)
    {
        // Arrange
        var command = ValidCommand() with { FirstName = firstName };

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CaptureLeadCommand.FirstName));
    }

    [Fact]
    public void Validate_Should_Fail_When_EmailIsMissing()
    {
        // Arrange
        var command = ValidCommand() with { Email = "" };

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CaptureLeadCommand.Email));
    }

    [Fact]
    public void Validate_Should_Fail_When_EmailIsMalformed()
    {
        // Arrange
        var command = ValidCommand() with { Email = "not-an-email" };

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CaptureLeadCommand.Email));
    }

    [Fact]
    public void Validate_Should_Fail_When_PhoneIsMissing()
    {
        // Arrange
        var command = ValidCommand() with { Phone = "" };

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CaptureLeadCommand.Phone));
    }

    #endregion

    #region Bounds

    [Fact]
    public void Validate_Should_Fail_When_MessageExceedsMaxLength()
    {
        // Arrange
        var command = ValidCommand() with { Message = new string('x', 4097) };

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CaptureLeadCommand.Message));
    }

    [Fact]
    public void Validate_Should_Fail_When_ServiceTypeIsOutOfRange()
    {
        // Arrange
        var command = ValidCommand() with { ServiceType = (ServiceType)999 };

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CaptureLeadCommand.ServiceType));
    }

    [Fact]
    public void Validate_Should_Fail_When_LandingPageExceedsMaxLength()
    {
        // Arrange
        var command = ValidCommand() with { LandingPage = $"https://x/{new string('p', 2048)}" };

        // Act
        var result = _sut.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CaptureLeadCommand.LandingPage));
    }

    #endregion
}
