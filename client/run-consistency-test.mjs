import { apiFetch } from "./api-client.mjs";

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}`);
  }
}

async function main() {
  // --- 1. Login (D1.6) ---
  const loginResult = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "retailer@reflex.test", password: "correct-password" }),
  });
  check("login returns a token", typeof loginResult.token === "string");
  check("login returns user.role = RETAILER_STAFF", loginResult.user.role === "RETAILER_STAFF");
  const token = loginResult.token;

  // --- 1b. Invalid login (error path) ---
  try {
    await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "retailer@reflex.test", password: "wrong" }),
    });
    check("invalid login rejected", false);
  } catch (err) {
    check("invalid login rejected with a clear message", err.message === "Invalid email or password");
  }

  // --- 2. Dashboard before creating anything (D1.7) ---
  const emptyList = await apiFetch("/api/deliveries", {}, token);
  check("dashboard starts empty (DeliveryTable's empty state applies)", emptyList.deliveries.length === 0);

  // --- 3. Create a delivery (D1.8) ---
  const formValues = {
    customerName: "Amina Otieno",
    customerPhone: "+254 700 111 222",
    address: "Moi Avenue, Nairobi",
    itemDescription: "2x phone chargers",
  };
  const createResult = await apiFetch(
    "/api/deliveries",
    { method: "POST", body: JSON.stringify(formValues) },
    token
  );
  check("created delivery has server-assigned id", typeof createResult.delivery.id === "string");
  check("created delivery starts PENDING", createResult.delivery.status === "PENDING");
  check("created delivery has a generated trackingCode", createResult.delivery.trackingCode.startsWith("RFX-"));
  check("created delivery has no assigned rider yet", createResult.delivery.assignedRider === null);
  const createdId = createResult.delivery.id;

  // --- 3b. Validation failure (error path) ---
  try {
    await apiFetch(
      "/api/deliveries",
      { method: "POST", body: JSON.stringify({ customerName: "Only Name" }) },
      token
    );
    check("missing-fields submission rejected", false);
  } catch (err) {
    check("missing-fields submission rejected with a clear message", err.message === "Missing required delivery fields");
  }

  // --- 4. THE CONSISTENCY CHECK: does the created delivery actually
  //         show up in a subsequent dashboard fetch? ---
  const listAfterCreate = await apiFetch("/api/deliveries", {}, token);
  check("dashboard now shows exactly 1 delivery", listAfterCreate.deliveries.length === 1);
  check(
    "the delivery in the list is the one just created (same id)",
    listAfterCreate.deliveries[0].id === createdId
  );
  check(
    "the delivery in the list has the customer name we submitted",
    listAfterCreate.deliveries[0].customerName === formValues.customerName
  );

  // --- 5. THE CONSISTENCY CHECK: does the detail fetch match what
  //         the list and create responses said? ---
  const detailResult = await apiFetch(`/api/deliveries/${createdId}`, {}, token);
  check("detail fetch succeeds for the created id", detailResult.delivery.id === createdId);
  check(
    "detail matches the address submitted at creation",
    detailResult.delivery.address === formValues.address
  );
  check(
    "detail matches the itemDescription submitted at creation",
    detailResult.delivery.itemDescription === formValues.itemDescription
  );
  check(
    "detail's status agrees with the list's status",
    detailResult.delivery.status === listAfterCreate.deliveries[0].status
  );

  // --- 5b. Not-found detail (error path) ---
  try {
    await apiFetch("/api/deliveries/does-not-exist", {}, token);
    check("not-found delivery id rejected", false);
  } catch (err) {
    check("not-found delivery id rejected with a clear message", err.message === "Delivery not found");
  }

  // --- 6. Unauthorized access (no token) ---
  try {
    await apiFetch("/api/deliveries");
    check("missing token rejected", false);
  } catch (err) {
    check("missing token rejected with a clear message", err.message === "Unauthorized");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
