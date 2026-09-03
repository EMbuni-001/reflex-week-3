import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

/**
 * AppLayout — Task D1.3 (flagged addition beyond the four named
 * components, agreed with the team before implementation)
 * ---------------------------------------------------------------------
 * SHARED COMPONENT: wraps Navbar + Sidebar + page content consistently.
 * Used by AppRouter around every protected route so Developer 1, 2, and
 * 3's pages all get the same chrome without each of us wiring up
 * Navbar/Sidebar by hand on every page (which invites visual drift —
 * see PROJECT_SPEC.md §17's "clarity over visual complexity").
 *
 * Props:
 *   sidebarLinks (array, required) — passed straight through to
 *     Sidebar's `links` prop. Each role's route group in AppRouter
 *     supplies its own set — AppLayout itself makes no assumptions
 *     about which links belong to which role.
 *   children — the page content to render in the main content area.
 */
export default function AppLayout({ sidebarLinks, children }) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={sidebarLinks} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
