using FSH.Framework.Shared.Persistence;
using FSH.Modules.Crm.Contracts.Dtos;
using FSH.Modules.Crm.Contracts.v1.Leads;
using FSH.Modules.Crm.Data;
using FSH.Modules.Crm.Domain;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace FSH.Modules.Crm.Features.v1.Leads.SearchLeads;

public sealed class SearchLeadsQueryHandler(CrmDbContext dbContext)
    : IQueryHandler<SearchLeadsQuery, PagedResponse<LeadDto>>
{
    public async ValueTask<PagedResponse<LeadDto>> Handle(SearchLeadsQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        int page = query.PageNumber < 1 ? 1 : query.PageNumber;
        int size = query.PageSize is < 1 or > 200 ? 20 : query.PageSize;

        var q = dbContext.Leads.AsNoTracking().AsQueryable();

        if (query.Status is { } status)
        {
            q = q.Where(l => l.Status == status);
        }
        if (query.ServiceType is { } serviceType)
        {
            q = q.Where(l => l.ServiceType == serviceType);
        }
        if (query.Source is { } source)
        {
            q = q.Where(l => l.Source == source);
        }
        if (!string.IsNullOrWhiteSpace(query.City))
        {
            string city = query.City.Trim();
            q = q.Where(l => l.City != null && EF.Functions.ILike(l.City, $"%{city}%"));
        }
        if (query.CapturedFrom is { } from)
        {
            q = q.Where(l => l.CreatedOnUtc >= from);
        }
        if (query.CapturedTo is { } to)
        {
            q = q.Where(l => l.CreatedOnUtc <= to);
        }
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            string term = query.Search.Trim();
            q = q.Where(l =>
                EF.Functions.ILike(l.FirstName, $"%{term}%") ||
                EF.Functions.ILike(l.LastName, $"%{term}%") ||
                EF.Functions.ILike(l.Email, $"%{term}%") ||
                EF.Functions.ILike(l.Phone, $"%{term}%"));
        }

        q = ApplySort(q, query.SortBy, query.SortDir);

        long total = await q.LongCountAsync(cancellationToken).ConfigureAwait(false);

        // Project with note count via subquery so we don't have to
        // materialize the notes collection just to count it.
        var projected = await q
            .Skip((page - 1) * size)
            .Take(size)
            .Select(l => new
            {
                Lead = l,
                NoteCount = dbContext.LeadNotes.Count(n => n.LeadId == l.Id),
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResponse<LeadDto>
        {
            Items = projected.Select(p => p.Lead.ToDto(p.NoteCount)).ToList(),
            PageNumber = page,
            PageSize = size,
            TotalCount = total,
            TotalPages = (int)Math.Ceiling(total / (double)size)
        };
    }

    private static IQueryable<Lead> ApplySort(IQueryable<Lead> q, string? sortBy, string? sortDir)
    {
        bool desc = !string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);
        return (sortBy?.ToUpperInvariant()) switch
        {
            "NAME"           => desc ? q.OrderByDescending(l => l.LastName).ThenByDescending(l => l.FirstName)
                                     : q.OrderBy(l => l.LastName).ThenBy(l => l.FirstName),
            "STATUS"         => desc ? q.OrderByDescending(l => l.Status)         : q.OrderBy(l => l.Status),
            "SOURCE"         => desc ? q.OrderByDescending(l => l.Source)         : q.OrderBy(l => l.Source),
            "SERVICETYPE"    => desc ? q.OrderByDescending(l => l.ServiceType)    : q.OrderBy(l => l.ServiceType),
            "CITY"           => desc ? q.OrderByDescending(l => l.City)           : q.OrderBy(l => l.City),
            "ESTIMATEDVALUE" => desc ? q.OrderByDescending(l => l.EstimatedValue) : q.OrderBy(l => l.EstimatedValue),
            _ => desc ? q.OrderByDescending(l => l.CreatedOnUtc) : q.OrderBy(l => l.CreatedOnUtc),
        };
    }
}
