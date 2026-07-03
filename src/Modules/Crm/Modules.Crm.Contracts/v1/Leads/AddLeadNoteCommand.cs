using Mediator;

namespace FSH.Modules.Crm.Contracts.v1.Leads;

public sealed record AddLeadNoteCommand(Guid LeadId, string Body) : ICommand<Guid>;
