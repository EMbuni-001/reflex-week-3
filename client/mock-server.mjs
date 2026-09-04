import http from "http";

/**
 * Coherent mock backend for the D1.11 consistency pass.
 *
 * Unlike the per-task mock servers used in D1.6-D1.10 (each testing one
 * endpoint in isolation with hardcoded fixture responses), this one
 * keeps real in-memory state across requests: a delivery created via
 * POST /api/deliveries actually appears in a later GET /api/deliveries
 * or GET /api/deliveries/:id call in the SAME test run. This is what
 * "consistency" means here - proving the frontend's assumptions agree
 * with each other across the whole flow, not just individually.
 *
 * Implements exactly the assumed contract documented in:
 *   - AuthContext.jsx      (POST /api/auth/login)
 *   - RetailerDashboard.jsx (GET /api/deliveries)
 *   - DeliveryCreate.jsx    (POST /api/deliveries)
 *   - RetailerDeliveryDetail.jsx (GET /api/deliveries/:id)
 *
 * This is NOT a substitute for testing against Developer 2's real
 * backend (see D1.11's manual-test-checklist.md for that). It only
 * proves the frontend's own assumptions are self-consistent.
 */

let deliveries = [];
let nextId = 1;

const VALID_USER = { email: "retailer@reflex.test", password: "correct-password" };

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    res.setHeader("Content-Type", "application/json");
    const parsed = body ? JSON.parse(body) : {};
    const token = (req.headers.authorization || "").replace("Bearer ", "");

    // POST /api/auth/login
    if (req.method === "POST" && req.url === "/api/auth/login") {
      if (parsed.email === VALID_USER.email && parsed.password === VALID_USER.password) {
        res.statusCode = 200;
        res.end(JSON.stringify({
          token: "consistency-test-token",
          user: { id: "u1", name: "Test Retailer", email: parsed.email, role: "RETAILER_STAFF" },
        }));
      } else {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: "Invalid email or password" }));
      }
      return;
    }

    // All routes below require the token issued by login above
    const authorized = token === "consistency-test-token";

    // POST /api/deliveries
    if (req.method === "POST" && req.url === "/api/deliveries") {
      if (!authorized) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
      const { customerName, customerPhone, address, itemDescription } = parsed;
      if (!customerName || !customerPhone || !address || !itemDescription) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Missing required delivery fields" }));
        return;
      }
      const delivery = {
        id: String(nextId++),
        trackingCode: `RFX-${1000 + deliveries.length + 1}`,
        customerName,
        customerPhone,
        address,
        itemDescription,
        status: "PENDING",
        assignedRider: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deliveredAt: null,
      };
      deliveries.push(delivery);
      res.statusCode = 201;
      res.end(JSON.stringify({ delivery }));
      return;
    }

    // GET /api/deliveries
    if (req.method === "GET" && req.url === "/api/deliveries") {
      if (!authorized) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ deliveries }));
      return;
    }

    // GET /api/deliveries/:id
    const detailMatch = req.url.match(/^\/api\/deliveries\/([^/]+)$/);
    if (req.method === "GET" && detailMatch) {
      if (!authorized) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
      const found = deliveries.find((d) => d.id === detailMatch[1]);
      if (!found) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Delivery not found" }));
        return;
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ delivery: found }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
  });
});

server.listen(4400, () => console.log("Consistency mock server up on :4400"));
