using FSH.Framework.Shared.Constants;

namespace FSH.Modules.Crm.Contracts.Authorization;

public static class CrmPermissions
{
    public static class Leads
    {
        public const string Resource = "Leads";
        public const string View         = $"Permissions.{Resource}.View";
        public const string Update       = $"Permissions.{Resource}.Update";
        public const string UpdateStatus = $"Permissions.{Resource}.UpdateStatus";
        public const string Note         = $"Permissions.{Resource}.Note";
    }

    public static IReadOnlyList<FshPermission> All { get; } =
    [
        new("View Leads",         ActionConstants.View,   Leads.Resource, IsBasic: true),
        new("Update Leads",       ActionConstants.Update, Leads.Resource),
        new("Update Lead Status", "UpdateStatus", Leads.Resource),
        new("Add Lead Notes",     "Note",         Leads.Resource),
    ];
}
