/**
 * Tests for useDeliveryRealtime / useDeliveryEventsRealtime
 * (D3-6).
 *
 * Mocks the Supabase client's channel chain entirely — there is
 * no real Supabase project or D2-16 real-time config in this
 * sandbox (or in the project at all yet). These tests verify
 * the hook's own contract: it subscribes with the right
 * table/filter, forwards change events to the caller's
 * callback unmodified, and cleans up its channel on unmount.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useDeliveryRealtime,
  useDeliveryEventsRealtime,
} from "./useDeliveryRealtime";

const onMock = vi.fn();
const subscribeMock = vi.fn();
const channelMock = vi.fn();
const removeChannelMock = vi.fn();

vi.mock("../services/supabaseClient", () => ({
  supabase: {
    channel: (...args) => channelMock(...args),
    removeChannel: (...args) => removeChannelMock(...args),
  },
}));

describe("useDeliveryRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Chainable mock: channel().on().subscribe()
    const chain = {
      on: onMock.mockReturnThis(),
      subscribe: subscribeMock,
    };
    channelMock.mockReturnValue(chain);
    subscribeMock.mockReturnValue(chain);
  });

  it("subscribes to the deliveries table with no filter when none is given", () => {
    renderHook(() => useDeliveryRealtime({ onChange: vi.fn() }));

    expect(onMock).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "*",
        schema: "public",
        table: "deliveries",
      }),
      expect.any(Function)
    );
    const [, config] = onMock.mock.calls[0];
    expect(config.filter).toBeUndefined();
  });

  it("subscribes with a role-specific filter when provided (e.g. Rider scoping)", () => {
    renderHook(() =>
      useDeliveryRealtime({
        filter: "assigned_rider_id=eq.rider-a",
        onChange: vi.fn(),
      })
    );

    const [, config] = onMock.mock.calls[0];
    expect(config.filter).toBe("assigned_rider_id=eq.rider-a");
  });

  it("calls onChange with the raw payload when a change event fires", () => {
    const onChange = vi.fn();
    renderHook(() => useDeliveryRealtime({ onChange }));

    // Grab the handler passed to .on() and simulate Supabase
    // invoking it with a change payload.
    const [, , handler] = onMock.mock.calls[0];
    const fakePayload = { eventType: "UPDATE", new: { id: "d1", status: "ASSIGNED" } };
    handler(fakePayload);

    expect(onChange).toHaveBeenCalledWith(fakePayload);
  });

  it("does not subscribe when enabled is false", () => {
    renderHook(() => useDeliveryRealtime({ onChange: vi.fn(), enabled: false }));

    expect(channelMock).not.toHaveBeenCalled();
  });

  it("removes the channel on unmount", () => {
    const { unmount } = renderHook(() =>
      useDeliveryRealtime({ onChange: vi.fn() })
    );

    unmount();

    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  it("always calls the latest onChange even if the callback reference changes between renders", () => {
    const firstOnChange = vi.fn();
    const secondOnChange = vi.fn();

    const { rerender } = renderHook(
      ({ onChange }) => useDeliveryRealtime({ onChange }),
      { initialProps: { onChange: firstOnChange } }
    );

    rerender({ onChange: secondOnChange });

    const [, , handler] = onMock.mock.calls[0];
    handler({ eventType: "UPDATE" });

    expect(firstOnChange).not.toHaveBeenCalled();
    expect(secondOnChange).toHaveBeenCalledTimes(1);
  });
});

describe("useDeliveryEventsRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = {
      on: onMock.mockReturnThis(),
      subscribe: subscribeMock,
    };
    channelMock.mockReturnValue(chain);
    subscribeMock.mockReturnValue(chain);
  });

  it("subscribes to delivery_events filtered by delivery_id", () => {
    renderHook(() =>
      useDeliveryEventsRealtime({ deliveryId: "d1", onChange: vi.fn() })
    );

    expect(onMock).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "INSERT",
        table: "delivery_events",
        filter: "delivery_id=eq.d1",
      }),
      expect.any(Function)
    );
  });

  it("does not subscribe when deliveryId is missing", () => {
    renderHook(() => useDeliveryEventsRealtime({ onChange: vi.fn() }));

    expect(channelMock).not.toHaveBeenCalled();
  });

  it("forwards new event rows to the caller", () => {
    const onChange = vi.fn();
    renderHook(() =>
      useDeliveryEventsRealtime({ deliveryId: "d1", onChange })
    );

    const [, , handler] = onMock.mock.calls[0];
    const fakePayload = {
      eventType: "INSERT",
      new: { id: "e1", delivery_id: "d1", event_type: "PICKED_UP" },
    };
    handler(fakePayload);

    expect(onChange).toHaveBeenCalledWith(fakePayload);
  });

  it("removes the channel on unmount", () => {
    const { unmount } = renderHook(() =>
      useDeliveryEventsRealtime({ deliveryId: "d1", onChange: vi.fn() })
    );

    unmount();

    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });
});