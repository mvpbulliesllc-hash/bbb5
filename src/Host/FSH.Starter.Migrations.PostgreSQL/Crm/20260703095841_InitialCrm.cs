using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FSH.Starter.Migrations.PostgreSQL.Crm
{
    /// <inheritdoc />
    public partial class InitialCrm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "crm");

            migrationBuilder.CreateTable(
                name: "Leads",
                schema: "crm",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LastName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Phone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Address = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    City = table.Column<string>(type: "character varying(96)", maxLength: 96, nullable: true),
                    ZipCode = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ServiceType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Message = table.Column<string>(type: "character varying(4096)", maxLength: 4096, nullable: true),
                    PreferredContactMethod = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Source = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    UtmSource = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    UtmMedium = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    UtmCampaign = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    UtmTerm = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    UtmContent = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    LandingPage = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    Referrer = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    EstimatedValue = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    LostReason = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LeadNotes",
                schema: "crm",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    Body = table.Column<string>(type: "character varying(4096)", maxLength: 4096, nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeadNotes_Leads_LeadId",
                        column: x => x.LeadId,
                        principalSchema: "crm",
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeadNotes_LeadId",
                schema: "crm",
                table: "LeadNotes",
                column: "LeadId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_City",
                schema: "crm",
                table: "Leads",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_CreatedOnUtc",
                schema: "crm",
                table: "Leads",
                column: "CreatedOnUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_Email",
                schema: "crm",
                table: "Leads",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_ServiceType",
                schema: "crm",
                table: "Leads",
                column: "ServiceType");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_Source",
                schema: "crm",
                table: "Leads",
                column: "Source");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_Status",
                schema: "crm",
                table: "Leads",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeadNotes",
                schema: "crm");

            migrationBuilder.DropTable(
                name: "Leads",
                schema: "crm");
        }
    }
}
