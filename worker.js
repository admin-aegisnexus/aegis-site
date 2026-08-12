/**
 * Aegis Nexus Public Gateway Worker - api.aegisnexus.ai
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Aegis-Client-Version",
  "Content-Type": "application/json; charset=utf-8"
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS, status: 204 });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. Health / Status Endpoint
      if (path === "/v1/health" || path === "/status") {
        return new Response(
          JSON.stringify({
            status: "online",
            bridge: "verified",
            service: "api.aegisnexus.ai",
            timestamp: new Date().toISOString()
          }),
          { headers: CORS_HEADERS, status: 200 }
        );
      }

      // 2. Latest Curriculum Endpoint
      if (path === "/v1/curriculum/latest" || path === "/api/v1/curriculum/latest") {
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
      if (path === "/v1/scam-sandbox/scenarios" || path === "/scam_sandbox") {
        const scenariosData = await env.AEGIS_CURRICULUM_KV.get("scam_sandbox_scenarios");
        return new Response(
          scenariosData || JSON.stringify({ scenarios: [] }),
          { headers: CORS_HEADERS, status: 200 }
        );
      }

      // 4. Progress Synchronization Endpoint: /api/progress/:testerId
      if (path.startsWith("/api/progress/")) {
        const testerId = path.split("/")[3];
        const profileKey = `profile_${testerId}`;
        let profileRaw = await env.AEGIS_CURRICULUM_KV.get(profileKey);

        let profile = profileRaw ? JSON.parse(profileRaw) : {
          nickname: "Pilot",
          modules_completed_today: 0,
          completed_list: [],
          email: testerId
        };

        return new Response(JSON.stringify(profile), { headers: CORS_HEADERS, status: 200 });
      }

      // 5. Module Completion Endpoint: /complete/:testerId
      if (path.startsWith("/complete/")) {
        const testerId = path.split("/")[2];
        const moduleName = url.searchParams.get("module") || "generic";
        const profileKey = `profile_${testerId}`;
        
        let profileRaw = await env.AEGIS_CURRICULUM_KV.get(profileKey);
        let profile = profileRaw ? JSON.parse(profileRaw) : {
          nickname: "Pilot",
          modules_completed_today: 0,
          completed_list: [],
          email: testerId
        };

        if (!profile.completed_list.includes(moduleName) && moduleName !== "generic") {
          profile.completed_list.push(moduleName);
        }
        
        const uniqueMods = new Set(profile.completed_list.filter(m => m !== "generic"));
        profile.modules_completed_today = uniqueMods.size;
        profile.last_active = new Date().toISOString();

        await env.AEGIS_CURRICULUM_KV.put(profileKey, JSON.stringify(profile));

        // Return a redirect response compatible with app expectations (aegis://start_training)
        return new Response(JSON.stringify({ status: "success", completed_list: profile.completed_list }), { headers: CORS_HEADERS, status: 200 });
      }

      // 6. Pilot Registration Endpoint: /api/register_pilot
      if (path === "/api/register_pilot" && request.method === "POST") {
        const reqData = await request.json();
        const hardwareId = reqData.hardwareId;
        const email = (reqData.email || "").trim();
        const nickname = (reqData.nickname || "").trim();

        if (!email || !nickname || !hardwareId) {
          return new Response(JSON.stringify({ error: "Missing registration strings" }), { headers: CORS_HEADERS, status: 400 });
        }

        const profileKey = `profile_${email}`;
        let profile = {
          nickname: nickname,
          email: email,
          hardware_id: hardwareId,
          modules_completed_today: 0,
          completed_list: [],
          enrollment_date: new Date().toISOString()
        };

        await env.AEGIS_CURRICULUM_KV.put(profileKey, JSON.stringify(profile));
        return new Response(JSON.stringify({ status: "success" }), { headers: CORS_HEADERS, status: 200 });
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
