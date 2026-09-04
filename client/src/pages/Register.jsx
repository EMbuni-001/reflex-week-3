import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { apiFetch } from "../lib/api";
import ErrorState from "../components/ErrorState";

export default function Register() {
  const navigate = useNavigate();
  const [registrationError, setRegistrationError] = useState(null);
  const [registered, setRegistered] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email, password, name, phone }) => {
    setRegistrationError(null);

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name, phone }),
      });
      setRegistered(true);
    } catch (err) {
      setRegistrationError(err.message);
    }
  };

  if (registered) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <section className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">Account created</h1>
          <p className="mt-3 text-sm text-gray-600">
            Your Retailer Staff account is ready. Sign in to continue.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to sign in
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">Create a Retailer Staff account</h1>
        <p className="mt-2 text-sm text-gray-500">
          Register to create and follow your deliveries.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-700">
            Name
            <input
              {...register("name", { required: "Name is required" })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
            />
            {errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>}
          </label>

          <label className="text-sm font-medium text-gray-700">
            Phone
            <input
              type="tel"
              {...register("phone", { required: "Phone is required" })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
            />
            {errors.phone && <span className="mt-1 block text-xs text-red-600">{errors.phone.message}</span>}
          </label>

          <label className="text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" },
              })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
            />
            {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>}
          </label>

          <label className="text-sm font-medium text-gray-700">
            Password
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
            />
            {errors.password && <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>}
          </label>

          <label className="text-sm font-medium text-gray-700">
            Confirm password
            <input
              type="password"
              {...register("passwordConfirmation", {
                required: "Please confirm your password",
                validate: (value) => value === watch("password") || "Passwords do not match",
              })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
            />
            {errors.passwordConfirmation && (
              <span className="mt-1 block text-xs text-red-600">{errors.passwordConfirmation.message}</span>
            )}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        {registrationError && (
          <div className="mt-4">
            <ErrorState message={registrationError} inline />
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}