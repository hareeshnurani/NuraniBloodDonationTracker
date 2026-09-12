"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  onLocation: (lat: number, lng: number) => void;
  defaultLat?: number | null;
  defaultLng?: number | null;
}

export function LocationPicker({ onLocation, defaultLat, defaultLng }: LocationPickerProps) {
  const [lat, setLat] = useState(defaultLat?.toString() ?? "");
  const [lng, setLng] = useState(defaultLng?.toString() ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultLat && defaultLng) {
      setLat(defaultLat.toString());
      setLng(defaultLng.toString());
    }
  }, [defaultLat, defaultLng]);

  function detectLocation() {
    setLoading(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));
        onLocation(latitude, longitude);
        setLoading(false);
      },
      () => {
        setError("Unable to get your location. Please enable location permissions.");
        setLoading(false);
      }
    );
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="secondary" onClick={detectLocation} disabled={loading}>
        <MapPin className="mr-2 h-4 w-4" />
        {loading ? "Detecting..." : "Use my current location"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input type="hidden" name="latitude" value={lat} required />
      <input type="hidden" name="longitude" value={lng} required />
      {lat && lng && (
        <p className="text-xs text-gray-500">
          Location set: {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
        </p>
      )}
    </div>
  );
}
