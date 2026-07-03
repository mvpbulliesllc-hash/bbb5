using FSH.Modules.Crm.Domain.Events;
using Mediator;
using Microsoft.Extensions.Logging;

namespace FSH.Modules.Crm.Events;

public sealed class LeadEventHandlers(ILogger<LeadEventHandlers> logger) :
    INotificationHandler<LeadCapturedDomainEvent>,
    INotificationHandler<LeadStatusChangedDomainEvent>,
    INotificationHandler<LeadNoteAddedDomainEvent>
{
    public ValueTask Handle(LeadCapturedDomainEvent notification, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(notification);
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(
                "Lead {LeadId} captured from {Source} for {ServiceType}",
                notification.LeadId, notification.Source, notification.ServiceType);
        }
        return default;
    }

    public ValueTask Handle(LeadStatusChangedDomainEvent notification, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(notification);
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(
                "Lead {LeadId} moved from {PreviousStatus} to {NewStatus}",
                notification.LeadId, notification.PreviousStatus, notification.NewStatus);
        }
        return default;
    }

    public ValueTask Handle(LeadNoteAddedDomainEvent notification, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(notification);
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(
                "Note {NoteId} added to lead {LeadId}",
                notification.NoteId, notification.LeadId);
        }
        return default;
    }
}
