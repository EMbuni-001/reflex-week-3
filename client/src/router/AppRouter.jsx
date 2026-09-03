import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import AppLayout from "../components/AppLayout";

import Login from "../pages/Login";
import RetailerDashboard from "../pages/retailer/RetailerDashboard";
import DeliveryCreate from "../pages/retailer/DeliveryCreate";
import RetailerDeliveryDetail from "../pages/retailer/RetailerDeliveryDetail";
import DispatcherDashboard from "../pages/dispatcher/DispatcherDashboard";
import DispatcherDeliveryDetail from "../pages/dispatcher/DispatcherDeliveryDetail";
import RiderDashboard from "../pages/rider/RiderDashboard";
import RiderDeliveryDetail from "../pages/rider/RiderDeliveryDetail";
import RiderScan from "../pages/rider/RiderScan";
import ComponentPreview from "../pages/dev/ComponentPreview";

/**
 * AppRouter — Tasks D1.2 + D1.3
 * -------------------------------
 * All 9 routes required by PROJECT_SPEC.md §12.1. Each non-login route
 * is wrapped in ProtectedRoute (role check, D1.2) and AppLayout
 * (shared Navbar/Sidebar chrome, D1.3).
 *
 * Role values used below (RETAILER_STAFF / DISPATCHER / RIDER) follow
 * the naming pattern set by the team's locked decision for Rider
 * ("role = RIDER"), but RETAILER_STAFF/DISPATCHER are NOT yet confirmed
 * by the team — see the note in AuthContext.jsx. Update here if the
 * team settles on different values.
 *
 * Per the D1.2 integration note: pages under /dispatcher/* and /rider/*
 * are placeholders only. Developer 2 and Developer 3 own their real
 * implementations (see the shared implementation plan). The sidebar
 * link sets below (DISPATCHER_LINKS, RIDER_LINKS) are my best-guess
 * defaults so the layout isn't empty for those roles — Developer 2 and
 * Developer 3 should adjust these to whatever navigation their pages
 * actually need; this isn't a locked contract on their behalf.
 */
const RETAILER_LINKS = [
  { label: "Dashboard", path: "/retailer/dashboard" },
  { label: "New Delivery", path: "/retailer/deliveries/new" },
];

const DISPATCHER_LINKS = [{ label: "Dashboard", path: "/dispatcher/dashboard" }];

const RIDER_LINKS = [
  { label: "Dashboard", path: "/rider/dashboard" },
  { label: "Scan QR", path: "/rider/scan" },
];

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Retailer routes — Developer 1 */}
        <Route
          path="/retailer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["RETAILER_STAFF"]}>
              <AppLayout sidebarLinks={RETAILER_LINKS}>
                <RetailerDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/retailer/deliveries/new"
          element={
            <ProtectedRoute allowedRoles={["RETAILER_STAFF"]}>
              <AppLayout sidebarLinks={RETAILER_LINKS}>
                <DeliveryCreate />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/retailer/deliveries/:id"
          element={
            <ProtectedRoute allowedRoles={["RETAILER_STAFF"]}>
              <AppLayout sidebarLinks={RETAILER_LINKS}>
                <RetailerDeliveryDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Dispatcher routes — placeholders only, owned by Developer 2 */}
        <Route
          path="/dispatcher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["DISPATCHER"]}>
              <AppLayout sidebarLinks={DISPATCHER_LINKS}>
                <DispatcherDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dispatcher/deliveries/:id"
          element={
            <ProtectedRoute allowedRoles={["DISPATCHER"]}>
              <AppLayout sidebarLinks={DISPATCHER_LINKS}>
                <DispatcherDeliveryDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Rider routes — placeholders only, owned by Developer 3 */}
        <Route
          path="/rider/dashboard"
          element={
            <ProtectedRoute allowedRoles={["RIDER"]}>
              <AppLayout sidebarLinks={RIDER_LINKS}>
                <RiderDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider/deliveries/:id"
          element={
            <ProtectedRoute allowedRoles={["RIDER"]}>
              <AppLayout sidebarLinks={RIDER_LINKS}>
                <RiderDeliveryDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider/scan"
          element={
            <ProtectedRoute allowedRoles={["RIDER"]}>
              <AppLayout sidebarLinks={RIDER_LINKS}>
                <RiderScan />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Dev-only component preview (Task D1.3 testing aid) — never
            present in a production build. */}
        {import.meta.env.DEV && (
          <Route path="/dev/components" element={<ComponentPreview />} />
        )}

        {/* No catch-all/unauthorized route defined in PROJECT_SPEC.md §12.1 —
            default unmatched paths to /login rather than inventing a new route. */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
