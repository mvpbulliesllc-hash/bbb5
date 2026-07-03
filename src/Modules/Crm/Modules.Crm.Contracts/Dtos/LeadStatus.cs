namespace FSH.Modules.Crm.Contracts.Dtos;

/// <summary>
/// Pipeline stage of a lead, from first contact through closing.
/// </summary>
public enum LeadStatus
{
    New,
    Contacted,
    EstimateScheduled,
    EstimateSent,
    Won,
    Lost,
}
