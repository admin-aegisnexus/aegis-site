/**
 * Aegis Nexus Public Gateway Worker - api.aegisnexus.ai
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Aegis-Client-Version",
  "Content-Type": "application/json; charset=utf-8"
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS, status: 204 });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. Health Endpoint
      if (path === "/v1/health") {
        return new Response(
          JSON.stringify({
            status: "ok",
            service: "api.aegisnexus.ai",
            timestamp: new Date().toISOString()
          }),
          { headers: CORS_HEADERS, status: 200 }
        );
      }

      // 2. Latest Curriculum Endpoint
      if (path === "/v1/curriculum/latest") {
        const weekNum = url.searchParams.get("week") || "5";
        const curriculumData = await env.AEGIS_CURRICULUM_KV.get(`week_${weekNum}`);

        if (!curriculumData) {
          return new Response(
            JSON.stringify({ error: "Curriculum not found for requested week" }),
            { headers: CORS_HEADERS, status: 404 }
          );
        }

        return new Response(curriculumData, { headers: CORS_HEADERS, status: 200 });
      }

      // 3. Scam Sandbox Scenarios Endpoint
      if (path === "/v1/scam-sandbox/scenarios") {
        const scenariosData = await env.AEGIS_CURRICULUM_KV.get("scam_sandbox_scenarios");
        
        return new Response(
          scenariosData || JSON.stringify({ scenarios: [] }),
          { headers: CORS_HEADERS, status: 200 }
        );
      }

      // Fallback for unknown routes
      return new Response(
        JSON.stringify({ error: "Endpoint not found" }),
        { headers: CORS_HEADERS, status: 404 }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Internal Gateway Error", details: err.message }),
        { headers: CORS_HEADERS, status: 500 }
      );
    }
  }
};
