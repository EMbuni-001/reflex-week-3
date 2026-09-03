import { useAuth } from "../context/AuthContext";

/**
 * Navbar — shared component (Task D1.3, PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * SHARED COMPONENT: Developer 2 and Developer 3 should reuse this
 * rather than building their own top bar (AI-RULES.md §4.5).
 *
 * Deliberately role-agnostic: it shows whoever is currently signed in
 * (via AuthContext, built in D1.2) and a logout action. It does NOT
 * contain role-specific navigation links — that's Sidebar's job, via
 * its `links` prop, so this component stays reusable across all three
 * roles without embedding assumptions about any one role's routes.
 *
 * Props: none required. Reads user/logout directly from AuthContext
 * so callers don't have to thread auth data down manually.
 */
export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <span className="text-lg font-semibold text-gray-800">Reflex</span>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.name} <span className="text-gray-400">({user.role})</span>
          </span>
          <button
            onClick={logout}
            className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
