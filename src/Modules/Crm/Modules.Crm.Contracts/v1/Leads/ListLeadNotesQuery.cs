using FSH.Modules.Crm.Contracts.Dtos;
using Mediator;

namespace FSH.Modules.Crm.Contracts.v1.Leads;

public sealed record ListLeadNotesQuery(Guid LeadId) : IQuery<IReadOnlyList<LeadNoteDto>>;
