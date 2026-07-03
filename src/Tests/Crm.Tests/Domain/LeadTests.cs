using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Domain;
using FSH.Modules.Crm.Domain.Events;

namespace Crm.Tests.Domain;

public sealed class LeadTests
{
    private static Lead CaptureLead(
        LeadSource source = LeadSource.Website,
        ServiceType serviceType = ServiceType.RoofReplacement) =>
        Lead.Capture(
            firstName: "Jane",
            lastName: "Homeowner",
            email: "jane@example.com",
            phone: "262-555-0100",
            serviceType: serviceType,
            preferredContactMethod: ContactMethod.Phone,
            source: source);

    #region Capture (Happy Path)

    [Fact]
    public void Capture_Should_SetFieldsAndDefaultStatusNew_When_Valid()
    {
        // Act
        Lead lead = Lead.Capture(
            firstName: "  Jane ",
            lastName: " Homeowner  ",
            email: " jane@example.com ",
            phone: " 262-555-0100 ",
            serviceType: ServiceType.RoofRepair,
            preferredContactMethod: ContactMethod.Text,
            source: LeadSource.GoogleAds,
            address: " 123 Main St ",
            city: " Waukesha ",
            zipCode: " 53186 ",
            message: " Hail damage on the north slope. ",
            utmSource: "google",
            utmMedium: "cpc",
            utmCampaign: "storm-2026",
            utmTerm: "roof repair near me",
            utmContent: "ad-a",
            landingPage: "https://paragonexteriorsllc.com/roof-repair",
            referrer: "https://www.google.com/");

        // Assert
        lead.Id.ShouldNotBe(Guid.Empty);
        lead.FirstName.ShouldBe("Jane");
        lead.LastName.ShouldBe("Homeowner");
        lead.Email.ShouldBe("jane@example.com");
        lead.Phone.ShouldBe("262-555-0100");
        lead.ServiceType.ShouldBe(ServiceType.RoofRepair);
        lead.PreferredContactMethod.ShouldBe(ContactMethod.Text);
        lead.Source.ShouldBe(LeadSource.GoogleAds);
        lead.Address.ShouldBe("123 Main St");
        lead.City.ShouldBe("Waukesha");
        lead.ZipCode.ShouldBe("53186");
        lead.Message.ShouldBe("Hail damage on the north slope.");
        lead.UtmSource.ShouldBe("google");
        lead.UtmMedium.ShouldBe("cpc");
        lead.UtmCampaign.ShouldBe("storm-2026");
        lead.UtmTerm.ShouldBe("roof repair near me");
        lead.UtmContent.ShouldBe("ad-a");
        lead.LandingPage.ShouldBe("https://paragonexteriorsllc.com/roof-repair");
        lead.Referrer.ShouldBe("https://www.google.com/");
        lead.Status.ShouldBe(LeadStatus.New);
        lead.EstimatedValue.ShouldBeNull();
        lead.LostReason.ShouldBeNull();
        lead.Notes.ShouldBeEmpty();
    }

    [Fact]
    public void Capture_Should_NormalizeBlankOptionalFieldsToNull_When_WhitespaceProvided()
    {
        // Act
        Lead lead = Lead.Capture(
            firstName: "Jane",
            lastName: "Homeowner",
            email: "jane@example.com",
            phone: "262-555-0100",
            serviceType: ServiceType.Gutters,
            preferredContactMethod: ContactMethod.Email,
            source: LeadSource.Website,
            address: "   ",
            city: "",
            message: "  ");

        // Assert
        lead.Address.ShouldBeNull();
        lead.City.ShouldBeNull();
        lead.Message.ShouldBeNull();
    }

    [Fact]
    public void Capture_Should_RaiseLeadCapturedDomainEvent_When_Valid()
    {
        // Act
        Lead lead = CaptureLead(source: LeadSource.Instagram, serviceType: ServiceType.Siding);

        // Assert
        var captured = lead.DomainEvents.OfType<LeadCapturedDomainEvent>().ShouldHaveSingleItem();
        captured.LeadId.ShouldBe(lead.Id);
        captured.Source.ShouldBe(LeadSource.Instagram);
        captured.ServiceType.ShouldBe(ServiceType.Siding);
    }

    #endregion

    #region Capture (Exception)

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Capture_Should_Throw_When_FirstNameIsBlank(string? firstName)
    {
        // Act / Assert
        Should.Throw<ArgumentException>(() => Lead.Capture(
            firstName!, "Homeowner", "jane@example.com", "262-555-0100",
            ServiceType.Roofing, ContactMethod.Phone, LeadSource.Website));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Capture_Should_Throw_When_EmailIsBlank(string? email)
    {
        // Act / Assert
        Should.Throw<ArgumentException>(() => Lead.Capture(
            "Jane", "Homeowner", email!, "262-555-0100",
            ServiceType.Roofing, ContactMethod.Phone, LeadSource.Website));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Capture_Should_Throw_When_PhoneIsBlank(string? phone)
    {
        // Act / Assert
        Should.Throw<ArgumentException>(() => Lead.Capture(
            "Jane", "Homeowner", "jane@example.com", phone!,
            ServiceType.Roofing, ContactMethod.Phone, LeadSource.Website));
    }

    #endregion

    #region ChangeStatus (Happy Path)

    [Fact]
    public void ChangeStatus_Should_TransitionAndRaiseEvent_When_StatusDiffers()
    {
        // Arrange
        Lead lead = CaptureLead();
        lead.ClearDomainEvents();

        // Act
        lead.ChangeStatus(LeadStatus.Contacted);

        // Assert
        lead.Status.ShouldBe(LeadStatus.Contacted);
        var changed = lead.DomainEvents.OfType<LeadStatusChangedDomainEvent>().ShouldHaveSingleItem();
        changed.LeadId.ShouldBe(lead.Id);
        changed.PreviousStatus.ShouldBe(LeadStatus.New);
        changed.NewStatus.ShouldBe(LeadStatus.Contacted);
    }

    [Fact]
    public void ChangeStatus_Should_SetLostReason_When_MovingToLost()
    {
        // Arrange
        Lead lead = CaptureLead();

        // Act
        lead.ChangeStatus(LeadStatus.Lost, lostReason: "  Went with a cheaper quote  ");

        // Assert
        lead.Status.ShouldBe(LeadStatus.Lost);
        lead.LostReason.ShouldBe("Went with a cheaper quote");
    }

    [Fact]
    public void ChangeStatus_Should_ClearLostReason_When_LeavingLost()
    {
        // Arrange
        Lead lead = CaptureLead();
        lead.ChangeStatus(LeadStatus.Lost, lostReason: "No budget");

        // Act — storm season brings lost jobs back.
        lead.ChangeStatus(LeadStatus.Contacted);

        // Assert
        lead.Status.ShouldBe(LeadStatus.Contacted);
        lead.LostReason.ShouldBeNull();
    }

    [Fact]
    public void ChangeStatus_Should_UpdateEstimatedValue_When_Provided()
    {
        // Arrange
        Lead lead = CaptureLead();

        // Act
        lead.ChangeStatus(LeadStatus.EstimateSent, estimatedValue: 18500.50m);

        // Assert
        lead.Status.ShouldBe(LeadStatus.EstimateSent);
        lead.EstimatedValue.ShouldBe(18500.50m);
    }

    [Fact]
    public void ChangeStatus_Should_KeepEstimatedValue_When_NotProvided()
    {
        // Arrange
        Lead lead = CaptureLead();
        lead.ChangeStatus(LeadStatus.EstimateSent, estimatedValue: 12000m);

        // Act
        lead.ChangeStatus(LeadStatus.Won);

        // Assert
        lead.EstimatedValue.ShouldBe(12000m);
    }

    #endregion

    #region ChangeStatus (Edge Cases)

    [Fact]
    public void ChangeStatus_Should_NotRaiseEvent_When_StatusUnchanged()
    {
        // Arrange
        Lead lead = CaptureLead();
        lead.ClearDomainEvents();

        // Act
        lead.ChangeStatus(LeadStatus.New);

        // Assert
        lead.Status.ShouldBe(LeadStatus.New);
        lead.DomainEvents.ShouldBeEmpty();
    }

    [Fact]
    public void ChangeStatus_Should_RefreshLostReason_When_AlreadyLost()
    {
        // Arrange
        Lead lead = CaptureLead();
        lead.ChangeStatus(LeadStatus.Lost, lostReason: "No budget");
        lead.ClearDomainEvents();

        // Act
        lead.ChangeStatus(LeadStatus.Lost, lostReason: "Chose competitor");

        // Assert — reason refreshed, but no phantom transition event.
        lead.LostReason.ShouldBe("Chose competitor");
        lead.DomainEvents.ShouldBeEmpty();
    }

    #endregion

    #region AddNote

    [Fact]
    public void AddNote_Should_AddToCollectionAndReturnId_When_Valid()
    {
        // Arrange
        Lead lead = CaptureLead();

        // Act
        Guid noteId = lead.AddNote("  Called homeowner, estimate booked for Tuesday.  ");

        // Assert
        noteId.ShouldNotBe(Guid.Empty);
        var note = lead.Notes.ShouldHaveSingleItem();
        note.Id.ShouldBe(noteId);
        note.LeadId.ShouldBe(lead.Id);
        note.Body.ShouldBe("Called homeowner, estimate booked for Tuesday.");
    }

    [Fact]
    public void AddNote_Should_RaiseLeadNoteAddedDomainEvent_When_Valid()
    {
        // Arrange
        Lead lead = CaptureLead();
        lead.ClearDomainEvents();

        // Act
        Guid noteId = lead.AddNote("Estimate emailed.");

        // Assert
        var added = lead.DomainEvents.OfType<LeadNoteAddedDomainEvent>().ShouldHaveSingleItem();
        added.LeadId.ShouldBe(lead.Id);
        added.NoteId.ShouldBe(noteId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void AddNote_Should_Throw_When_BodyIsBlank(string? body)
    {
        // Arrange
        Lead lead = CaptureLead();

        // Act / Assert
        Should.Throw<ArgumentException>(() => lead.AddNote(body!));
    }

    #endregion

    #region UpdateDetails

    [Fact]
    public void UpdateDetails_Should_MutateContactFields_When_Valid()
    {
        // Arrange
        Lead lead = CaptureLead();

        // Act
        lead.UpdateDetails(
            firstName: " John ",
            lastName: " Buyer ",
            email: " john@example.com ",
            phone: " 414-555-0199 ",
            serviceType: ServiceType.Windows,
            preferredContactMethod: ContactMethod.Email,
            address: "456 Oak Ave",
            city: "Brookfield",
            zipCode: "53045",
            message: "Updated scope",
            estimatedValue: 9500m);

        // Assert
        lead.FirstName.ShouldBe("John");
        lead.LastName.ShouldBe("Buyer");
        lead.Email.ShouldBe("john@example.com");
        lead.Phone.ShouldBe("414-555-0199");
        lead.ServiceType.ShouldBe(ServiceType.Windows);
        lead.PreferredContactMethod.ShouldBe(ContactMethod.Email);
        lead.Address.ShouldBe("456 Oak Ave");
        lead.City.ShouldBe("Brookfield");
        lead.ZipCode.ShouldBe("53045");
        lead.Message.ShouldBe("Updated scope");
        lead.EstimatedValue.ShouldBe(9500m);
    }

    [Fact]
    public void UpdateDetails_Should_NotTouchStatusOrAttribution_When_Called()
    {
        // Arrange
        Lead lead = Lead.Capture(
            "Jane", "Homeowner", "jane@example.com", "262-555-0100",
            ServiceType.Roofing, ContactMethod.Phone, LeadSource.Facebook,
            utmSource: "facebook", utmCampaign: "spring-promo");
        lead.ChangeStatus(LeadStatus.Contacted);

        // Act
        lead.UpdateDetails(
            "Jane", "Homeowner", "jane@example.com", "262-555-0100",
            ServiceType.Roofing, ContactMethod.Phone,
            address: null, city: null, zipCode: null, message: null, estimatedValue: null);

        // Assert
        lead.Status.ShouldBe(LeadStatus.Contacted);
        lead.Source.ShouldBe(LeadSource.Facebook);
        lead.UtmSource.ShouldBe("facebook");
        lead.UtmCampaign.ShouldBe("spring-promo");
    }

    [Fact]
    public void UpdateDetails_Should_Throw_When_EmailIsBlank()
    {
        // Arrange
        Lead lead = CaptureLead();

        // Act / Assert
        Should.Throw<ArgumentException>(() => lead.UpdateDetails(
            "Jane", "Homeowner", " ", "262-555-0100",
            ServiceType.Roofing, ContactMethod.Phone,
            address: null, city: null, zipCode: null, message: null, estimatedValue: null));
    }

    #endregion
}
