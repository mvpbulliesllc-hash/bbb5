using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Features.v1.Leads.UpdateLeadStatus;

namespace Crm.Tests.Validators;

public sealed class UpdateLeadStatusCommandValidatorTests
{
    private readonly UpdateLeadStatusCommandValidator _sut = new();

    #region Happy Path

    [Theory]
    [InlineData(LeadStatus.New)]
    [InlineData(LeadStatus.Contacted)]
    [InlineData(LeadStatus.EstimateScheduled)]
    [InlineData(LeadStatus.EstimateSent)]
    [InlineData(LeadStatus.Won)]
    public void Validate_Should_Pass_When_NonLostStatusWithoutReason(LeadStatus status)
    {
        // Act
        var result = _sut.Validate(new UpdateLeadStatusCommand(Guid.NewGuid(), status));

        // Assert
        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public void Validate_Should_Pass_When_LostWithReason()
    {
        // Act
        var result = _sut.Validate(
            new UpdateLeadStatusCommand(Guid.NewGuid(), LeadStatus.Lost, "Went with competitor"));

        // Assert
        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public void Validate_Should_Pass_When_EstimatedValueIsPositive()
    {
        // Act
        var result = _sut.Validate(
            new UpdateLeadStatusCommand(Guid.NewGuid(), LeadStatus.EstimateSent, null, 15000m));

        // Assert
        result.IsValid.ShouldBeTrue();
    }

    #endregion

    #region Exception

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_Should_Fail_When_LostWithoutReason(string? lostReason)
    {
        // Act
        var result = _sut.Validate(
            new UpdateLeadStatusCommand(Guid.NewGuid(), LeadStatus.Lost, lostReason));

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(UpdateLeadStatusCommand.LostReason));
    }

    [Fact]
    public void Validate_Should_Fail_When_LeadIdIsEmpty()
    {
        // Act
        var result = _sut.Validate(new UpdateLeadStatusCommand(Guid.Empty, LeadStatus.Contacted));

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(UpdateLeadStatusCommand.LeadId));
    }

    [Fact]
    public void Validate_Should_Fail_When_StatusIsOutOfRange()
    {
        // Act
        var result = _sut.Validate(new UpdateLeadStatusCommand(Guid.NewGuid(), (LeadStatus)999));

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(UpdateLeadStatusCommand.Status));
    }

    [Fact]
    public void Validate_Should_Fail_When_EstimatedValueIsNegative()
    {
        // Act
        var result = _sut.Validate(
            new UpdateLeadStatusCommand(Guid.NewGuid(), LeadStatus.EstimateSent, null, -1m));

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(UpdateLeadStatusCommand.EstimatedValue));
    }

    #endregion
}
