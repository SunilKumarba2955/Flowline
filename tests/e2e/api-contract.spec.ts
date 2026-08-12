import { expect, test } from "@playwright/test";

test("GraphQL dashboard preserves four independent bureau reports", async ({ request }) => {
  const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:4000";
  const response = await request.post(`${apiBaseUrl}/graphql`, {
    data: {
      query: "query { dashboard(scope: PERSONAL) { scope currency monthlyIncomeMinor monthlySpendMinor savingsRate creditUtilization bureauReports { bureau score } riskAssessment { level advisoryOnly } } }"
    }
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.errors).toBeUndefined();
  expect(body.data.dashboard.scope).toBe("PERSONAL");
  expect(body.data.dashboard.bureauReports).toHaveLength(4);
  expect(new Set(body.data.dashboard.bureauReports.map((report: { bureau: string }) => report.bureau)).size).toBe(4);
});
