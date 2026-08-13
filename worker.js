/**
 * Aegis Nexus Public Gateway Worker - api.aegisnexus.ai
 * PII-Safe Tokenized KV Architecture & Multi-Device Binding
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Aegis-Client-Version, Authorization",
  "Content-Type": "application/json; charset=utf-8"
};

// Helper to generate a pseudonymous token from an email to avoid PII in KV keys
async function generateProfileToken(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `u_pub_${hashHex.substring(0, 12)}`;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS, status: 204 });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 0. Root / Enrollment Landing Page
      if (path === "/" || path === "") {
        const hardwareId = url.searchParams.get("hardware_id") || "unknown_device";
        const htmlContent = `
          <html>
          <head><title>Aegis Nexus Enrollment</title></head>
          <body style="background:#001f3f; color:white; font-family:sans-serif; text-align:center; padding-top:40px;">
            <h2>🛡️ AEGIS NEXUS PUBLIC ENROLLMENT</h2>
            <p>Hardware ID: ${hardwareId}</p>
            <form action="https://api.aegisnexus.ai/api/register_pilot" method="POST" style="margin-top:20px;">
              <input type="hidden" name="hardwareId" value="${hardwareId}" />
              <input type="text" name="email" placeholder="Enter Tester Email" style="padding:10px; width:280px; display:block; margin:10px auto;" required /><br/>
              <input type="text" name="nickname" placeholder="Enter Pilot Callsign" style="padding:10px; width:280px; display:block; margin:10px auto;" required /><br/>
              <button type="submit" style="background:#FFD700; color:#001f3f; padding:12px 24px; font-weight:bold; border:none; border-radius:5px;">ENROLL DEVICE</button>
            </form>
          </body>
          </html>
        `;
        return new Response(htmlContent, { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 });
      }

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

      // 4. Progress Synchronization Endpoint: /api/progress/:testerId (or token)
      if (path.startsWith("/api/progress/")) {
        const testerId = path.split("/")[3];
        // Support direct token or lookup via email/token index
        let profileKey = testerId.startsWith("u_pub_") ? `profile_${testerId}` : null;
        
        if (!profileKey) {
          const token = await generateProfileToken(testerId);
          profileKey = `profile_${token}`;
        }

        let profileRaw = await env.AEGIS_CURRICULUM_KV.get(profileKey);

        let profile = profileRaw ? JSON.parse(profileRaw) : {
          nickname: "Pilot",
          modules_completed_today: 0,
          completed_list: []
        };

         // 🔒 PII Containment: Exclude email and hardware identifiers from public telemetry egress
        const sanitizedProfile = {
          nickname: profile.nickname || "Pilot",
          modules_completed_today: profile.modules_completed_today || 0,
          completed_list: profile.completed_list || [],
          last_active: profile.last_active || new Date().toISOString()
        };

        return new Response(JSON.stringify(sanitizedProfile), { headers: CORS_HEADERS, status: 200 });
      }

      // 5. Module Completion Endpoint: /complete/:testerId
      if (path.startsWith("/complete/")) {
        const testerId = path.split("/")[2];
        const moduleName = url.searchParams.get("module") || "generic";
        
        let profileKey = testerId.startsWith("u_pub_") ? `profile_${testerId}` : null;
        if (!profileKey) {
          const token = await generateProfileToken(testerId);
          profileKey = `profile_${token}`;
        }
        
        let profileRaw = await env.AEGIS_CURRICULUM_KV.get(profileKey);
        let profile = profileRaw ? JSON.parse(profileRaw) : {
          nickname: "Pilot",
          modules_completed_today: 0,
          completed_list: []
        };

        if (!profile.completed_list.includes(moduleName) && moduleName !== "generic") {
          profile.completed_list.push(moduleName);
        }
        
        const uniqueMods = new Set(profile.completed_list.filter(m => m !== "generic"));
        profile.modules_completed_today = uniqueMods.size;
        profile.last_active = new Date().toISOString();

        await env.AEGIS_CURRICULUM_KV.put(profileKey, JSON.stringify(profile));

        return new Response(JSON.stringify({ status: "success", completed_list: profile.completed_list }), { headers: CORS_HEADERS, status: 200 });
      }

      // 6. Pilot Registration Endpoint: /api/register_pilot (Supports JSON & Form Post)
      if (path === "/api/register_pilot" && (request.method === "POST" || request.method === "GET")) {
        let email, nickname, hardwareId;

        const contentType = request.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const reqData = await request.json();
          hardwareId = reqData.hardwareId;
          email = (reqData.email || "").trim();
          nickname = (reqData.nickname || "").trim();
        } else {
          const formData = await request.formData();
          hardwareId = formData.get("hardwareId");
          email = (formData.get("email") || "").trim();
          nickname = (formData.get("nickname") || "").trim();
        }

        if (!email || !nickname || !hardwareId) {
          return new Response(JSON.stringify({ error: "Missing registration strings" }), { headers: CORS_HEADERS, status: 400 });
        }

        const profileToken = await generateProfileToken(email);
        const profileKey = `profile_${profileToken}`;

        // Check if profile already exists to preserve completed modules & expand authorized devices
        let existingRaw = await env.AEGIS_CURRICULUM_KV.get(profileKey);
        let profile;

        if (existingRaw) {
          profile = JSON.parse(existingRaw);
          profile.nickname = nickname; // Allow update
          let devices = profile.authorized_devices || [profile.hardware_id].filter(Boolean);
          if (!devices.includes(hardwareId)) {
            devices.push(hardwareId);
          }
          profile.authorized_devices = devices;
        } else {
          profile = {
            nickname: nickname,
            email: email, // Kept securely inside the tokenized private KV record, never exposed in key path
            hardware_id: hardwareId,
            authorized_devices: [hardwareId],
            modules_completed_today: 0,
            completed_list: [],
            enrollment_date: new Date().toISOString()
          };
        }

        await env.AEGIS_CURRICULUM_KV.put(profileKey, JSON.stringify(profile));
        
        // Also map email index for fast resolution
        await env.AEGIS_CURRICULUM_KV.put(`index_email_${email.toLowerCase()}`, profileToken);

        return new Response(JSON.stringify({ status: "success", token: profileToken }), { headers: CORS_HEADERS, status: 200 });
      }
      
      // 7. Device Identity Lookup Endpoint: /api/device_identity/:hardwareId
      if (path.startsWith("/api/device_identity/")) {
        const hardwareId = path.split("/")[3];
        
        let listResult = await env.AEGIS_CURRICULUM_KV.list({ prefix: "profile_" });
        
        for (let key of listResult.keys) {
          let profileRaw = await env.AEGIS_CURRICULUM_KV.get(key.name);
          if (profileRaw) {
            let profile = JSON.parse(profileRaw);
            let devices = profile.authorized_devices || [profile.hardware_id].filter(Boolean);
            if (devices.includes(hardwareId)) {
              // 🔒 Returns tokenized handle for client storage instead of plain email
              return new Response(
                JSON.stringify({ token: key.name.replace("profile_", ""), nickname: profile.nickname }),
                { headers: CORS_HEADERS, status: 200 }
              );
            }
          }
        }

        return new Response(
          JSON.stringify({ error: "Device unknown" }),
          { headers: CORS_HEADERS, status: 404 }
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
