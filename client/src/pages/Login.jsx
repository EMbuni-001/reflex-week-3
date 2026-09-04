import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorState from "../components/ErrorState";

/**
 * /login — Task D1.6
 * ---------------------------------------------------------------------
 * Replaces the D1.2 stub. Submits email/password to AuthContext.login(),
 * which calls POST /api/auth/login (see AuthContext.jsx for the full
 * note on the assumed request/response shape).
 *
 * Redirects by role after a successful login. Route paths below match
 * PROJECT_SPEC.md §12.1 exactly. Role values (RETAILER_STAFF/
 * DISPATCHER/RIDER) are the same flagged assumption noted in
 * AuthContext.jsx and AppRouter.jsx — update here too if the team
 * settles on different values.
 */
const ROLE_HOME_ROUTES = {
  RETAILER_STAFF: "/retailer/dashboard",
  DISPATCHER: "/dispatcher/dashboard",
  RIDER: "/rider/dashboard",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email, password }) => {
    setLoginError(null);
    try {
      const user = await login(email, password);
      const homeRoute = ROLE_HOME_ROUTES[user.role];
      // Unknown/unexpected role: fall back to /login rather than
      // navigating somewhere undefined in PROJECT_SPEC.md §12.1.
      navigate(homeRoute ?? "/login");
    } catch (err) {
      setLoginError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-800">Reflex</h1>
        <p className="mb-6 text-sm text-gray-500">Sign in to continue.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              {...register("password", { required: "Password is required" })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Task D1.10: ErrorState now supports an `inline` variant sized
            for exactly this context, so this is genuinely the same
            shared component used everywhere else, not a bespoke message. */}
        {loginError && (
          <div className="mt-4">
            <ErrorState message={loginError} inline />
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Retailer Staff account?{" "}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
