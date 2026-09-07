import { useEffect } from "react";
import { supabase } from "./supabaseClient";

export function useDeliveryUpdates(onChange) {
  useEffect(() => {
    const channel = supabase
      .channel("delivery-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries" },
        () => onChange()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_events" },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}