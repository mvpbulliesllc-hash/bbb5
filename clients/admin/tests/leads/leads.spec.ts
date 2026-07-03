import { expect, test } from "@playwright/test";
import { seedAuthedSession, TEST_USER } from "../helpers/auth-seed";
import { installAdminShellMocks, ADMIN_PERMS, paged } from "../helpers/shell-mocks";
import { mockJsonResponse } from "../helpers/api-mocks";

const LEAD = {
  id: "lead-0001",
  firstName: "Dana",
  lastName: "Whitfield",
  email: "dana.whitfield@example.com",
  phone: "(262) 555-0148",
  address: "4821 W Capitol Dr",
  city: "Brookfield",
  zipCode: "53045",
  serviceType: "RoofReplacement", // string enum name — the real API contract
  message: "Hail damage on the south slope after the June storm.",
  preferredContactMethod: "Phone",
  status: "EstimateSent",
  source: "GoogleAds",
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "roof-replacement-q2",
  utmTerm: "roof replacement waukesha",
  utmContent: "ad-variant-b",
  landingPage: "/services/roof-replacement",
  referrer: "https://www.google.com/",
  estimatedValue: 18500,
  lostReason: null,
  createdOnUtc: "2026-06-15T13:45:00Z",
  lastModifiedOnUtc: null,
  noteCount: 2,
};

const NOTES = [
  {
    id: "note-1",
    leadId: LEAD.id,
    body: "Called — left a voicemail, will try again tomorrow.",
    createdBy: "rootadmin",
    createdOnUtc: "2026-06-16T09:12:00Z",
  },
  {
    id: "note-2",
    leadId: LEAD.id,
    body: "Estimate emailed: full tear-off and re-shingle.",
    createdBy: "rootadmin",
    createdOnUtc: "2026-06-18T15:40:00Z",
  },
];

// 12 Monday-aligned weekly buckets, zero-filled — mirrors the stats endpoint.
const WEEKS = Array.from({ length: 12 }, (_, i) => {
  const start = new Date(Date.UTC(2026, 3, 13)); // Mon 2026-04-13
  start.setUTCDate(start.getUTCDate() + i * 7);
  return { weekStart: start.toISOString().slice(0, 10), count: (i * 5) % 7 };
});

const STATS = {
  totalLeads: 42,
  byStatus: [
    { status: "New", count: 12 },
    { status: "Contacted", count: 9 },
    { status: "EstimateScheduled", count: 6 },
    { status: "EstimateSent", count: 7 },
    { status: "Won", count: 5 },
    { status: "Lost", count: 3 },
  ],
  bySource: [
    { source: "Website", count: 18 },
    { source: "GoogleAds", count: 10 },
    { source: "Referral", count: 8 },
    { source: "VoiceAgent", count: 6 },
  ],
  byServiceType: [
    { serviceType: "Roofing", count: 20 },
    { serviceType: "Siding", count: 12 },
    { serviceType: "Gutters", count: 10 },
  ],
  leadsPerWeek: WEEKS,
  conversionRate: 0.62,
  pipelineValue: 148500,
  wonValue: 63200,
};

/** Standard mock set for the leads surface. Page-specific overrides go after. */
async function installLeadMocks(page: import("@playwright/test").Page) {
  await mockJsonResponse(page, "**/api/v1/crm/leads?*", paged([LEAD], { pageSize: 25 }));
  await mockJsonResponse(page, "**/api/v1/crm/leads/stats", STATS);
  await mockJsonResponse(page, `**/api/v1/crm/leads/${LEAD.id}`, LEAD);
  await mockJsonResponse(page, `**/api/v1/crm/leads/${LEAD.id}/notes`, NOTES, { method: "GET" });
}

test.beforeEach(async ({ page }) => {
  await seedAuthedSession(page, { ...TEST_USER, permissions: [...ADMIN_PERMS] });
  await installAdminShellMocks(page);
});

test.describe("leads pipeline list", () => {
  test("renders the heading, KPI tiles, analytics panels, and a lead row", async ({ page }) => {
    await installLeadMocks(page);

    await page.goto("/leads");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Leads", exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // KPI strip from /crm/leads/stats.
    await expect(main.getByText("Total leads", { exact: true })).toBeVisible();
    await expect(main.getByText("Conversion rate", { exact: true })).toBeVisible();
    await expect(main.getByText("62%", { exact: true })).toBeVisible();
    await expect(main.getByText("$148,500", { exact: true })).toBeVisible();
    await expect(main.getByText("$63,200", { exact: true })).toBeVisible();

    // Analytics panels: weekly chart + status/source breakdowns.
    await expect(main.getByText("Leads per week", { exact: true })).toBeVisible();
    await expect(main.getByText("Pipeline by status", { exact: true })).toBeVisible();
    await expect(main.getByText("By source", { exact: true })).toBeVisible();

    // The lead row from the search mock.
    await expect(
      main.getByRole("button", { name: "Open lead Dana Whitfield" }),
    ).toBeVisible();
    await expect(main.getByText("dana.whitfield@example.com", { exact: true })).toBeVisible();
    await expect(main.getByText("$18,500", { exact: true })).toBeVisible();
  });

  test("shows the empty state when no leads match", async ({ page }) => {
    await installLeadMocks(page);
    // Re-register the list glob so the empty page wins over the seeded one.
    await mockJsonResponse(page, "**/api/v1/crm/leads?*", paged([], { pageSize: 25 }));

    await page.goto("/leads");

    const main = page.getByRole("main");
    await expect(main.getByText("No leads match your filters.", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("has the search box and status / service / source filters", async ({ page }) => {
    await installLeadMocks(page);

    await page.goto("/leads");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Leads", exact: true })).toBeVisible({
      timeout: 10_000,
    });

    await expect(main.getByText("// Filters", { exact: true })).toBeVisible();
    await expect(main.getByPlaceholder("Search name, email, phone…")).toBeVisible();
    await expect(main.getByRole("button", { name: "All statuses" })).toBeVisible();
    await expect(main.getByRole("button", { name: "All services" })).toBeVisible();
    await expect(main.getByRole("button", { name: "All sources" })).toBeVisible();
  });
});

test.describe("lead detail sheet", () => {
  test("opens on row click with contact, attribution, and the notes timeline", async ({ page }) => {
    await installLeadMocks(page);

    await page.goto("/leads");

    const main = page.getByRole("main");
    await main.getByRole("button", { name: "Open lead Dana Whitfield" }).click();

    // The sheet renders in a Radix portal (role=dialog), outside <main>.
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Dana Whitfield", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // Contact block.
    await expect(sheet.getByText("dana.whitfield@example.com", { exact: true })).toBeVisible();
    await expect(sheet.getByText("(262) 555-0148", { exact: true })).toBeVisible();

    // Attribution block surfaces the UTM capture metadata.
    await expect(sheet.getByText("utm_campaign", { exact: true })).toBeVisible();
    await expect(sheet.getByText("roof-replacement-q2", { exact: true })).toBeVisible();
    await expect(sheet.getByText("/services/roof-replacement", { exact: true })).toBeVisible();

    // Notes timeline from the notes endpoint.
    await expect(
      sheet.getByText("Estimate emailed: full tear-off and re-shingle.", { exact: true }),
    ).toBeVisible();
  });

  test("adds a note through the composer", async ({ page }) => {
    await installLeadMocks(page);
    await mockJsonResponse(page, `**/api/v1/crm/leads/${LEAD.id}/notes`, '"note-3"', {
      method: "POST",
    });

    await page.goto("/leads");
    await page.getByRole("button", { name: "Open lead Dana Whitfield" }).click();

    const sheet = page.getByRole("dialog");
    await sheet
      .getByPlaceholder("Call summary, estimate detail, follow-up reminder…")
      .fill("Homeowner confirmed Tuesday 9am walkthrough.");

    const postPromise = page.waitForRequest(
      (r) => r.url().includes(`/crm/leads/${LEAD.id}/notes`) && r.method() === "POST",
    );
    await sheet.getByRole("button", { name: "Add note" }).click();

    const post = await postPromise;
    expect(post.postDataJSON()).toEqual({
      body: "Homeowner confirmed Tuesday 9am walkthrough.",
    });
    await expect(page.getByText("Note added", { exact: true })).toBeVisible();
  });

  test("moving to Lost requires a reason, then submits the status change", async ({ page }) => {
    await installLeadMocks(page);
    await mockJsonResponse(page, `**/api/v1/crm/leads/${LEAD.id}/status`, `"${LEAD.id}"`, {
      method: "PUT",
    });

    await page.goto("/leads");
    await page.getByRole("button", { name: "Open lead Dana Whitfield" }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Pipeline", { exact: true })).toBeVisible({ timeout: 10_000 });

    // Pick "Lost" in the Move-to select (Radix dropdown, portalled menu).
    // The trigger's accessible name comes from its "Move to" label.
    await sheet.getByRole("button", { name: "Move to" }).click();
    await page.getByRole("menuitem", { name: "Lost" }).click();

    // The lost-reason field appears; submitting without it warns and does not PUT.
    await expect(
      sheet.getByPlaceholder("e.g. Went with another contractor; price too high"),
    ).toBeVisible();
    await sheet.getByRole("button", { name: "Update status" }).click();
    await expect(
      page.getByText("A lost reason is required when marking a lead as Lost.", { exact: true }),
    ).toBeVisible();

    // Fill the reason and submit — the PUT carries status + reason + value.
    await sheet
      .getByPlaceholder("e.g. Went with another contractor; price too high")
      .fill("Went with another contractor.");

    const putPromise = page.waitForRequest(
      (r) => r.url().includes(`/crm/leads/${LEAD.id}/status`) && r.method() === "PUT",
    );
    await sheet.getByRole("button", { name: "Update status" }).click();

    const put = await putPromise;
    expect(put.postDataJSON()).toEqual({
      status: "Lost",
      lostReason: "Went with another contractor.",
      estimatedValue: 18500,
    });
    await expect(page.getByText("Lead moved to Lost", { exact: true })).toBeVisible();
  });
});
