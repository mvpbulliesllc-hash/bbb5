using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Features.v1.Leads.SearchLeads;

namespace Crm.Tests.Validators;

public sealed class SearchLeadsQueryValidatorTests
{
    private readonly SearchLeadsQueryValidator _sut = new();

    #region Happy Path

    [Fact]
    public void Validate_Should_Pass_When_Defaults()
    {
        // Act
        var result = _sut.Validate(new SearchLeadsQuery());

        // Assert
        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public void Validate_Should_Pass_When_DateRangeIsOrdered()
    {
        // Arrange
        var query = new SearchLeadsQuery
        {
            CapturedFrom = new DateTimeOffset(2026, 6, 1, 0, 0, 0, TimeSpan.Zero),
            CapturedTo = new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero),
        };

        // Act / Assert
        _sut.Validate(query).IsValid.ShouldBeTrue();
    }

    #endregion

    #region Exception

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_Should_Fail_When_PageNumberIsNotPositive(int pageNumber)
    {
        // Act
        var result = _sut.Validate(new SearchLeadsQuery { PageNumber = pageNumber });

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(SearchLeadsQuery.PageNumber));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(201)]
    public void Validate_Should_Fail_When_PageSizeIsOutOfBounds(int pageSize)
    {
        // Act
        var result = _sut.Validate(new SearchLeadsQuery { PageSize = pageSize });

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(SearchLeadsQuery.PageSize));
    }

    [Fact]
    public void Validate_Should_Fail_When_DateRangeIsInverted()
    {
        // Arrange
        var query = new SearchLeadsQuery
        {
            CapturedFrom = new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero),
            CapturedTo = new DateTimeOffset(2026, 6, 1, 0, 0, 0, TimeSpan.Zero),
        };

        // Act
        var result = _sut.Validate(query);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(SearchLeadsQuery.CapturedTo));
    }

    #endregion
}
