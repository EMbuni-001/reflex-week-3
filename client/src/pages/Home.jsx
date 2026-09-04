import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link to="/" className="text-xl font-semibold tracking-tight text-white">
          Reflex<span className="text-orange-400">.</span>
        </Link>
        <Link
          to="/login"
          className="rounded border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-400 hover:text-white"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:pb-28 lg:pt-20">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
            Delivery control, made clear
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            Every delivery has a next step.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Reflex connects retail teams, dispatchers, and riders in one live delivery
            workflow, from the first request to verified handoff.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded bg-orange-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-orange-300"
            >
              Retailer Staff: get started
            </Link>
            <Link
              to="/login"
              className="rounded border border-slate-600 px-5 py-3 text-sm font-semibold text-white hover:border-slate-400"
            >
              Team sign in
            </Link>
          </div>
        </div>

        <div className="border-l border-slate-700 pl-6 lg:mt-10 lg:pl-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            One shared workflow
          </p>
          <ol className="mt-6 space-y-5">
            {[
              ["01", "Create", "Retailer records the customer, address, and order."],
              ["02", "Assign", "Dispatcher sends the delivery to a rider."],
              ["03", "Confirm", "Rider updates progress and verifies delivery by QR code."],
            ].map(([number, title, description]) => (
              <li key={number} className="flex gap-4">
                <span className="pt-1 text-sm font-semibold text-orange-400">{number}</span>
                <div>
                  <h2 className="font-semibold text-white">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/70">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              ["Retailer Staff", "Create delivery requests and follow their progress.", "Create account or sign in"],
              ["Dispatcher", "Assign riders and keep the delivery board moving.", "Sign in as Dispatcher"],
              ["Rider", "Manage assigned deliveries and confirm the correct order.", "Sign in as Rider"],
            ].map(([role, description, action]) => (
              <article key={role} className="border-t-2 border-slate-700 pt-5">
                <h2 className="text-lg font-semibold text-white">{role}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{description}</p>
                <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-orange-400 hover:text-orange-300">
                  {action} <span aria-hidden="true">-&gt;</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}