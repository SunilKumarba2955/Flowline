import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    smoke: {
      executor: "ramping-vus",
      stages: [
        { duration: __ENV.RAMP_DURATION || "10s", target: Number(__ENV.VUS || 5) },
        { duration: __ENV.HOLD_DURATION || "20s", target: Number(__ENV.VUS || 5) },
        { duration: "5s", target: 0 }
      ],
      gracefulRampDown: "5s"
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<350", "p(99)<800"],
    checks: ["rate>0.99"]
  }
};

const baseUrl = __ENV.API_BASE_URL || "http://127.0.0.1:4000";
const query = "query { dashboard(scope: PERSONAL) { scope bureauReports { bureau score } } }";

export default function () {
  const health = http.get(`${baseUrl}/health`);
  check(health, { "health is 200": (r) => r.status === 200 });

  const dashboard = http.post(`${baseUrl}/graphql`, JSON.stringify({ query }), {
    headers: { "Content-Type": "application/json" },
    tags: { operation: "dashboard" }
  });
  check(dashboard, {
    "dashboard is 200": (r) => r.status === 200,
    "dashboard has four bureaus": (r) => {
      try { return JSON.parse(r.body).data.dashboard.bureauReports.length === 4; } catch { return false; }
    }
  });
  sleep(0.2);
}

