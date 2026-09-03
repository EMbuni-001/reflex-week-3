import { useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import AppLayout from "../../components/AppLayout";
import StatusBadge from "../../components/StatusBadge";
import DeliveryCard from "../../components/DeliveryCard";
import DeliveryTable from "../../components/DeliveryTable";
import { AuthContext } from "../../context/AuthContext";

const ALL_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

// Mock deliveries for DeliveryCard/DeliveryTable preview (Task D1.5).
// Deliberately includes one unassigned delivery (PENDING, no rider)
// and a mix of other statuses so the preview exercises real edge
// cases, not just the happy path.
const MOCK_DELIVERIES = [
  {
    id: "1",
    trackingCode: "RFX-1001",
    customerName: "Amina Otieno",
    customerPhone: "+254 700 111 222",
    address: "Moi Avenue, Nairobi",
    itemDescription: "2x phone chargers",
    status: "PENDING",
    assignedRider: null,
    createdAt: "2026-08-30T09:00:00Z",
  },
  {
    id: "2",
    trackingCode: "RFX-1002",
    customerName: "James Mwangi",
    customerPhone: "+254 700 333 444",
    address: "Kimathi Street, Nairobi",
    itemDescription: "Prescription medication",
    status: "OUT_FOR_DELIVERY",
    assignedRider: { id: "r1", name: "Peter Kamau" },
    createdAt: "2026-08-30T08:15:00Z",
  },
  {
    id: "3",
    trackingCode: "RFX-1003",
    customerName: "Grace Wanjiru",
    customerPhone: "+254 700 555 666",
    address: "Ngong Road, Nairobi",
    itemDescription: "Hardware tools set",
    status: "DELIVERED",
    assignedRider: { id: "r2", name: "Samuel Njoroge" },
    createdAt: "2026-08-29T14:30:00Z",
  },
];

/**
 * /dev/components — TEMPORARY, DEV-ONLY preview page (Task D1.3)
 * ---------------------------------------------------------------------
 * Not a PROJECT_SPEC.md requirement — a testing aid only, same pattern
 * as DevAuthSwitcher from D1.2. Exists to satisfy D1.3's "manual visual
 * check in isolation" testing requirement without a full Storybook
 * setup (not part of the locked stack). Only reachable in dev builds —
 * see the import.meta.env.DEV guard in AppRouter.jsx.
 *
 * Renders each shared component with mock data/props so it can be
 * checked visually without real data or the real login flow.
 */
export default function ComponentPreview() {
  // Task D1.6 note: AuthContext.login() now makes a real network call
  // to POST /api/auth/login, which doesn't exist yet. This preview page
  // no longer uses the real AuthContext for the Navbar section — it
  // supplies its own isolated mock value via AuthContext.Provider, so
  // the preview tool never depends on a running backend.
  const [previewUser, setPreviewUser] = useState(null);
  const mockAuthValue = {
    user: previewUser,
    logout: () => setPreviewUser(null),
  };

  const [showRetry, setShowRetry] = useState(false);

  const mockLinks = [
    { label: "Dashboard", path: "/dev/components" },
    { label: "Example Link", path: "/dev/components" },
  ];

  return (
    <div className="flex flex-col gap-10 p-8">
      <h1 className="text-2xl font-bold">Component Preview (dev only)</h1>

      <section>
        <h2 className="mb-2 font-semibold">Navbar</h2>
        {!previewUser && (
          <button
            onClick={() =>
              setPreviewUser({ id: "dev-user", name: "Preview User", role: "RETAILER_STAFF" })
            }
            className="mb-2 rounded bg-blue-100 px-3 py-1 text-sm"
          >
            Sign in for preview
          </button>
        )}
        <div className="border border-gray-200">
          <AuthContext.Provider value={mockAuthValue}>
            <Navbar />
          </AuthContext.Provider>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Sidebar</h2>
        <div className="flex h-64 border border-gray-200">
          <Sidebar links={mockLinks} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">LoadingState</h2>
        <div className="border border-gray-200">
          <LoadingState />
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">ErrorState</h2>
        <div className="mb-2 flex gap-2">
          <button
            onClick={() => setShowRetry(false)}
            className="rounded bg-gray-100 px-3 py-1 text-sm"
          >
            Without retry
          </button>
          <button
            onClick={() => setShowRetry(true)}
            className="rounded bg-gray-100 px-3 py-1 text-sm"
          >
            With retry
          </button>
        </div>
        <div className="border border-gray-200">
          <ErrorState
            message="Could not load deliveries."
            onRetry={showRetry ? () => alert("retry clicked") : undefined}
          />
        </div>

        <p className="mt-4 mb-1 text-xs text-gray-400">
          Inline variant (Task D1.10, used in Login/DeliveryCreate):
        </p>
        <div className="max-w-sm border border-gray-200 p-4">
          <ErrorState
            message="Invalid email or password."
            inline
            onRetry={showRetry ? () => alert("retry clicked") : undefined}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">StatusBadge (all six values)</h2>
        <div className="flex flex-wrap gap-2 border border-gray-200 p-4">
          {ALL_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">DeliveryCard</h2>
        <div className="grid grid-cols-1 gap-3 border border-gray-200 p-4 sm:grid-cols-3">
          {MOCK_DELIVERIES.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onClick={() => alert(`Clicked ${delivery.trackingCode}`)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">DeliveryTable</h2>
        <div className="border border-gray-200 p-4">
          <DeliveryTable
            deliveries={MOCK_DELIVERIES}
            onRowClick={(delivery) => alert(`Clicked row ${delivery.trackingCode}`)}
          />
        </div>
        <p className="mt-4 mb-1 text-xs text-gray-400">Empty state:</p>
        <div className="border border-gray-200">
          <DeliveryTable deliveries={[]} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">AppLayout (composed)</h2>
        <div className="h-96 border border-gray-200">
          <AppLayout sidebarLinks={mockLinks}>
            <div className="p-4">Page content goes here.</div>
          </AppLayout>
        </div>
      </section>
    </div>
  );
}
