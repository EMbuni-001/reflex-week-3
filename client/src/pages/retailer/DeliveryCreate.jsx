import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import ErrorState from "../../components/ErrorState";

/**
 * /retailer/deliveries/new — Task D1.8
 *
 * Creates a new delivery by submitting customer information to:
 * POST /api/deliveries
 *
 * The form uses camelCase field names on the frontend, while the backend
 * expects snake_case field names. The onSubmit function explicitly maps
 * the frontend values to the backend API contract.
 *
 * Backend-generated fields such as status and trackingCode are NOT sent.
 * New deliveries are created with PENDING status and receive their
 * tracking code from the backend.
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
          body: JSON.stringify({
            customer_name: formValues.customerName,
            customer_phone: formValues.customerPhone,
            address: formValues.address,
            item_description: formValues.itemDescription,
          }),
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
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">
        Create Delivery
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-w-md flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Customer Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Customer name
          </label>

          <input
            type="text"
            {...register("customerName", {
              required: "Customer name is required",
            })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />

          {errors.customerName && (
            <p className="mt-1 text-xs text-red-600">
              {errors.customerName.message}
            </p>
          )}
        </div>

        {/* Customer Phone */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Customer phone
          </label>

          <input
            type="tel"
            {...register("customerPhone", {
              required: "Customer phone is required",
              pattern: {
                value: /^[0-9+\-\s()]{7,}$/,
                message: "Enter a valid phone number",
              },
            })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />

          {errors.customerPhone && (
            <p className="mt-1 text-xs text-red-600">
              {errors.customerPhone.message}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Address
          </label>

          <input
            type="text"
            {...register("address", {
              required: "Address is required",
            })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />

          {errors.address && (
            <p className="mt-1 text-xs text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* Item Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Item description
          </label>

          <textarea
            rows={3}
            {...register("itemDescription", {
              required: "Item description is required",
            })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />

          {errors.itemDescription && (
            <p className="mt-1 text-xs text-red-600">
              {errors.itemDescription.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create Delivery"}
        </button>

        {/* Submission Error */}
        {submitError && (
          <div className="mt-2">
            <ErrorState message={submitError} inline />
          </div>
        )}
      </form>
    </div>
  );
}