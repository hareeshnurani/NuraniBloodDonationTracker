"use client";

import { useEffect, useRef } from "react";
import { isGpsTimestampFresh } from "@/lib/profile-location";
import { updateGpsLocation } from "@/lib/actions/profile";

type Props = {
  useMyLocation: boolean;
  gpsUpdatedAt: string | null;
};

/** Silently refreshes GPS when "use my location" is on and data is older than 3 hours. */
export function UseMyLocationAutoRefresh({ useMyLocation, gpsUpdatedAt }: Props) {
  const ran = useRef(false);

  useEffect(() => {
    if (!useMyLocation || ran.current) return;
    if (isGpsTimestampFresh(gpsUpdatedAt)) return;
    ran.current = true;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await updateGpsLocation(pos.coords.latitude, pos.coords.longitude);
        window.location.reload();
      },
      () => {
        /* User denied or failed — stale state cleared on next server sync */
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [useMyLocation, gpsUpdatedAt]);

  return null;
}
