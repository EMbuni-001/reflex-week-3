/**
 * Tests for DeliveryTimeline (D3-7).
 *
 * Covers the task's specific acceptance scenario: a delivery
 * that has passed through creation, assignment, multiple
 * status changes, and confirmation, rendering all events in
 * order with type, performer, and timestamp.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DeliveryTimeline from "./DeliveryTimeline";

const FULL_LIFECYCLE_EVENTS = [
  {
    id: "e1",
    event_type: "CREATED",
    performed_by: "user-retailer-1",
    performed_by_name: "Amina (Retailer)",
    created_at: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "e2",
    event_type: "ASSIGNED",
    performed_by: "user-dispatcher-1",
    performed_by_name: "David (Dispatcher)",
    created_at: "2026-09-01T08:05:00.000Z",
  },
  {
    id: "e3",
    event_type: "PICKED_UP",
    performed_by: "user-rider-a",
    performed_by_name: "Rider A",
    created_at: "2026-09-01T09:00:00.000Z",
  },
  {
    id: "e4",
    event_type: "OUT_FOR_DELIVERY",
    performed_by: "user-rider-a",
    performed_by_name: "Rider A",
    created_at: "2026-09-01T09:30:00.000Z",
  },
  {
    id: "e5",
    event_type: "DELIVERED",
    performed_by: "user-rider-a",
    performed_by_name: "Rider A",
    created_at: "2026-09-01T10:00:00.000Z",
  },
];

describe("DeliveryTimeline", () => {
  it("shows an empty state when there are no events", () => {
    render(<DeliveryTimeline events={[]} />);
    expect(screen.getByTestId("delivery-timeline-empty")).toBeInTheDocument();
  });

  it("shows an empty state when events prop is omitted", () => {
    render(<DeliveryTimeline />);
    expect(screen.getByTestId("delivery-timeline-empty")).toBeInTheDocument();
  });

  it("renders one item per event", () => {
    render(<DeliveryTimeline events={FULL_LIFECYCLE_EVENTS} />);
    expect(screen.getAllByTestId("delivery-timeline-item")).toHaveLength(5);
  });

  it("renders events in the order given (full lifecycle: created -> assigned -> picked up -> out for delivery -> delivered)", () => {
    render(<DeliveryTimeline events={FULL_LIFECYCLE_EVENTS} />);
    const items = screen.getAllByTestId("delivery-timeline-item");
    const labels = items.map((item) => item.textContent);

    expect(labels[0]).toContain("Delivery created");
    expect(labels[1]).toContain("Rider assigned");
    expect(labels[2]).toContain("Picked up");
    expect(labels[3]).toContain("Out for delivery");
    expect(labels[4]).toContain("Delivered");
  });

  it("displays the performer's display name for each event", () => {
    render(<DeliveryTimeline events={FULL_LIFECYCLE_EVENTS} />);
    expect(screen.getByText(/Amina \(Retailer\)/)).toBeInTheDocument();
    expect(screen.getByText(/David \(Dispatcher\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/Rider A/).length).toBeGreaterThan(0);
  });

  it("displays a formatted timestamp for each event", () => {
    render(
      <DeliveryTimeline
        events={[
          {
            id: "e1",
            event_type: "CREATED",
            performed_by_name: "Amina",
            created_at: "2026-09-01T08:00:00.000Z",
          },
        ]}
      />
    );
    // Exact locale formatting varies by environment, so assert
    // on the underlying date's year rather than a fixed string.
    const item = screen.getByTestId("delivery-timeline-item");
    expect(item.textContent).toMatch(/2026/);
  });

  it("falls back to the raw performed_by id when no display name is provided", () => {
    render(
      <DeliveryTimeline
        events={[
          {
            id: "e1",
            event_type: "CANCELLED",
            performed_by: "user-dispatcher-99",
            created_at: "2026-09-01T08:00:00.000Z",
          },
        ]}
      />
    );
    expect(screen.getByText(/user-dispatcher-99/)).toBeInTheDocument();
  });

  it("falls back to 'Unknown' when neither performer field is present", () => {
    render(
      <DeliveryTimeline
        events={[
          { id: "e1", event_type: "CREATED", created_at: "2026-09-01T08:00:00.000Z" },
        ]}
      />
    );
    expect(screen.getByText(/Unknown/)).toBeInTheDocument();
  });

  it("falls back to the raw event_type string for an unrecognized type", () => {
    render(
      <DeliveryTimeline
        events={[
          {
            id: "e1",
            event_type: "SOME_FUTURE_EVENT",
            performed_by_name: "Someone",
            created_at: "2026-09-01T08:00:00.000Z",
          },
        ]}
      />
    );
    expect(screen.getByText("SOME_FUTURE_EVENT")).toBeInTheDocument();
  });
});