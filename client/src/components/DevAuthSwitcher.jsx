import { useAuth } from "../context/AuthContext";

/**
 * DevAuthSwitcher — TEMPORARY TESTING AID, NOT A PRODUCT FEATURE
 * -----------------------------------------------------------------
 * This is not part of any PROJECT_SPEC.md requirement. It exists only
 * so D1.2's acceptance criteria ("manual navigation test to each route,
 * authenticated and not") can actually be exercised before D1.6 builds
 * the real Supabase Auth login flow.
 *
 * It is guarded by `import.meta.env.DEV` in App.jsx and will never be
 * included in a production build. It should be deleted once D1.6 ships
 * a real login page, since at that point real sign-in covers this need.
 */
const ROLES = ["RETAILER_STAFF", "DISPATCHER", "RIDER"];

export default function DevAuthSwitcher() {
  const { user, login, logout } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold text-amber-800">
        Dev auth switcher (remove after D1.6)
      </p>
      <p className="mb-2 text-amber-700">
        Signed in as: {user ? `${user.role}` : "nobody"}
      </p>
      <div className="flex flex-wrap gap-1">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => login({ id: "dev-user", name: "Dev Test User", role })}
            className="rounded bg-amber-200 px-2 py-1 text-xs hover:bg-amber-300"
          >
            Sign in as {role}
          </button>
        ))}
        <button
          onClick={logout}
          className="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
