import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import ErrorState from "../../components/ErrorState";

/**
 * /retailer/deliveries/new — Task D1.8
 * ---------------------------------------------------------------------
 * Replaces the D1.2 stub. Captures customer name, customer phone,
 * address, and item description, then submits to POST /api/deliveries
 * (PROJECT_SPEC.md §6.2/§10.2). Reuses the same form pattern established
 * in Login.jsx (D1.6) rather than inventing a new one.
 *
 * ASSUMED request/response shape (F0.2 API contract doc not available
 * — flagged explicitly, consistent with every prior assumption in this
 * workstream, not a new guess):
 *   Request:  { customerName, customerPhone, address, itemDescription }
 *   Response: { delivery: { id, trackingCode, customerName, ...,
 *                            status: "PENDING", assignedRider: null } }
 *
 * `status` and `trackingCode` are deliberately NOT sent in the request —
 * both are backend-assigned per PROJECT_SPEC.md §7 (new deliveries
 * start PENDING) and §16 (tracking code is server-generated for QR use).
 *
 * This is flagged as the highest-risk field-naming assumption in the
 * whole Developer 1 workstream — see the D1.8 planning discussion.
 */
export default function DeliveryCreate() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formValues) => {
    setSubmitError(null);
    try {
      const data = await apiFetch(
        "/api/deliveries",
        {
          method: "POST",
          body: JSON.stringify(formValues),
        },
        token
      );
      navigate(`/retailer/deliveries/${data.delivery.id}`);
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Create Delivery</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-w-md flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Customer name</label>
          <input
            type="text"
            {...register("customerName", { required: "Customer name is required" })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.customerName && (
            <p className="mt-1 text-xs text-red-600">{errors.customerName.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Customer phone</label>
          <input
            type="tel"
            {...register("customerPhone", {
              required: "Customer phone is required",
              pattern: {
                // Deliberately loose — not inventing a specific country
                // format the spec doesn't define, just catching obvious
                // non-phone input (letters, empty punctuation, etc.).
                value: /^[0-9+\-\s()]{7,}$/,
                message: "Enter a valid phone number",
              },
            })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.customerPhone && (
            <p className="mt-1 text-xs text-red-600">{errors.customerPhone.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
          <input
            type="text"
            {...register("address", { required: "Address is required" })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.address && (
            <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Item description</label>
          <textarea
            rows={3}
            {...register("itemDescription", { required: "Item description is required" })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.itemDescription && (
            <p className="mt-1 text-xs text-red-600">{errors.itemDescription.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create Delivery"}
        </button>

        {/* Task D1.10: same fix as Login.jsx — ErrorState's inline
            variant is now used here too, so error display is genuinely
            consistent across every Developer 1 page. */}
        {submitError && (
          <div className="mt-2">
            <ErrorState message={submitError} inline />
          </div>
        )}
      </form>
    </div>
  );
}
