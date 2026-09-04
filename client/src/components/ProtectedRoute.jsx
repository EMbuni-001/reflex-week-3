import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "./LoadingState";

/**
 * ProtectedRoute — frontend route guard (Task D1.2)
 * --------------------------------------------------
 * SHARED COMPONENT: Developer 2 uses this for /dispatcher/* routes and
 * Developer 3 uses this for /rider/* routes. Its prop interface below
 * (`allowedRoles`) is now a shared contract — changing it later should
 * be flagged to the team per AI-RULES.md §9.4.
 *
 * IMPORTANT — this is NOT the security boundary. Per PROJECT_SPEC.md
 * §14 and AI-RULES.md §5.3/§5.4, the backend must independently enforce
 * authentication and authorization on every request. This component
 * only controls what the frontend *shows*; it must never be treated as
 * proof that an action is actually allowed.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={["RETAILER_STAFF"]}>
 *     <RetailerDashboard />
 *   </ProtectedRoute>
 *
 * Behavior:
 *   - No `allowedRoles` prop      -> any authenticated user may view it.
 *   - Not authenticated           -> redirect to /login (D1.2 acceptance
 *                                    criteria).
 *   - Authenticated, wrong role   -> render an inline message rather than
 *                                    redirect, since PROJECT_SPEC.md §12.1
 *                                    defines no "unauthorized" route and
 *                                    inventing one would be an undocumented
 *                                    requirement (AI-RULES.md §2.2).
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isInitializing, user } = useAuth();

  // Added in D1.6: wait for AuthContext to finish checking localStorage
  // for a previous session before deciding to redirect. Without this,
  // a page refresh would briefly show isAuthenticated=false and bounce
  // an actually-logged-in user to /login.
  if (isInitializing) {
    return <LoadingState message="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-center text-gray-600">
        You do not have access to this page.
      </div>
    );
  }

  return children;
}
