import { NavLink } from "react-router-dom";

/**
 * Sidebar — shared component (Task D1.3, PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * SHARED COMPONENT: Developer 2 and Developer 3 should reuse this
 * rather than building their own side navigation (AI-RULES.md §4.5).
 *
 * Deliberately contains no hardcoded routes. Each role's own layout
 * usage supplies its own `links`, so Sidebar itself makes no
 * assumptions about which routes belong to Retailer, Dispatcher, or
 * Rider — those decisions stay with whoever owns that role's pages.
 *
 * Props:
 *   links (array, required) — [{ label: string, path: string }]
 *     Rendered in the given order. Active link is highlighted via
 *     react-router's NavLink (already a project dependency, no new
 *     library introduced).
 */
export default function Sidebar({ links }) {
  return (
    <nav className="w-56 shrink-0 border-r border-gray-200 bg-gray-50 p-4">
      <ul className="flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.path}>
            <NavLink
              to={link.path}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
