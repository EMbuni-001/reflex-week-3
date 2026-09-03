import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./router/AppRouter";

/**
 * App — Tasks D1.2, D1.6
 *
 * Wraps the whole app in AuthProvider (real Supabase-backed auth state
 * as of D1.6) and renders AppRouter (all 9 required routes).
 *
 * DevAuthSwitcher (D1.2's temporary testing aid) has been removed —
 * real login now exists, so it's no longer needed, per its own
 * D1.2 comment ("should be deleted once D1.6 ships a real login page").
 */
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
