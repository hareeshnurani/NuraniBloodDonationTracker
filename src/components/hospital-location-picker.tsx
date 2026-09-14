"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FacilityPicker } from "@/components/facility-picker";
import { Input, Label } from "@/components/ui/input";
import { verifyPincode } from "@/lib/actions/pincode";
import type { Facility } from "@/lib/facilities";
import type { PincodeLookupResult } from "@/lib/pincode";
import { Building2, MapPin, Search, Loader2, CheckCircle2 } from "lucide-react";

export type LocationMode = "list" | "custom";

export interface HospitalLocationValue {
  mode: LocationMode;
  facility: Facility | null;
  customHospitalName: string;
  pincodeInfo: PincodeLookupResult | null;
}

interface HospitalLocationPickerProps {
  value: HospitalLocationValue;
  onChange: (value: HospitalLocationValue) => void;
}

export function HospitalLocationPicker({ value, onChange }: HospitalLocationPickerProps) {
  const [pincodeInput, setPincodeInput] = useState(value.pincodeInfo?.pincode ?? "");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  function setMode(mode: LocationMode) {
    onChange({
      mode,
      facility: mode === "list" ? value.facility : null,
      customHospitalName: mode === "custom" ? value.customHospitalName : "",
      pincodeInfo: mode === "custom" ? value.pincodeInfo : null,
    });
    if (mode === "list") {
      setPincodeInput("");
      setPincodeError("");
    }
  }

  async function handlePincodeLookup(pincode: string) {
    setPincodeInput(pincode);
    setPincodeError("");

    if (pincode.length !== 6) {
      onChange({ ...value, pincodeInfo: null });
      return;
    }

    setPincodeLoading(true);
    const result = await verifyPincode(pincode);
    setPincodeLoading(false);

    if ("error" in result) {
      setPincodeError(result.error);
      onChange({ ...value, pincodeInfo: null });
      return;
    }

    onChange({ ...value, pincodeInfo: result.data });
  }

  const isListValid = value.mode === "list" && value.facility !== null;
  const isCustomValid =
    value.mode === "custom" &&
    value.customHospitalName.trim().length > 0 &&
    value.pincodeInfo !== null;

  return (
    <div className="space-y-4">
      <div className="flex rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-1">
        <button
          type="button"
          onClick={() => setMode("list")}
          className={cn(
            "flex-1 rounded-[10px] py-2.5 text-[14px] font-medium transition-all",
            value.mode === "list"
              ? "bg-[var(--surface)] text-[var(--label)] shadow-sm"
              : "text-[var(--label-secondary)]"
          )}
        >
          Select from list
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={cn(
            "flex-1 rounded-[10px] py-2.5 text-[14px] font-medium transition-all",
            value.mode === "custom"
              ? "bg-[var(--surface)] text-[var(--label)] shadow-sm"
              : "text-[var(--label-secondary)]"
          )}
        >
          Not in list
        </button>
      </div>
      <p className="text-[12px] text-[var(--label-tertiary)]">
        {value.mode === "list"
          ? "Tap the search box below to browse 230+ hospitals and blood banks."
          : "Enter the hospital name and its 6-digit PIN code."}
      </p>

      {value.mode === "list" ? (
        <>
          <FacilityPicker
            onSelect={(facility) => onChange({ ...value, facility })}
            required={false}
            includeHiddenFields={false}
          />
          <input type="hidden" name="location_mode" value="list" />
          <input type="hidden" name="facility_id" value={value.facility?.id ?? ""} />
          {isListValid && (
            <input type="hidden" name="latitude" value={value.facility!.latitude} />
          )}
          {isListValid && (
            <input type="hidden" name="longitude" value={value.facility!.longitude} />
          )}
        </>
      ) : (
        <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--separator)] bg-[var(--surface-secondary)] p-4">
          <input type="hidden" name="location_mode" value="custom" />

          <div>
            <Label htmlFor="custom_hospital_name">Hospital / Blood bank name</Label>
            <div className="relative mt-1">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--label-tertiary)]" />
              <Input
                id="custom_hospital_name"
                name="custom_hospital_name"
                value={value.customHospitalName}
                onChange={(e) =>
                  onChange({ ...value, customHospitalName: e.target.value })
                }
                placeholder="Enter hospital or blood bank name"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pincode">PIN code of hospital location</Label>
            <p className="mb-2 text-[12px] text-[var(--label-secondary)]">
              Enter the 6-digit PIN code where blood is needed. Donors within 50 km of this area will be notified.
            </p>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--label-tertiary)]" />
              <Input
                id="pincode"
                name="pincode"
                inputMode="numeric"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                  handlePincodeLookup(digits);
                }}
                placeholder="e.g. 682011"
                className="pl-10 pr-10"
                required
              />
              {pincodeLoading && (
                <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--label-tertiary)]" />
              )}
              {!pincodeLoading && value.pincodeInfo && (
                <CheckCircle2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--success)]" />
              )}
            </div>
            {pincodeError && (
              <p className="mt-2 text-[13px] text-[var(--accent)]">{pincodeError}</p>
            )}
            {value.pincodeInfo && (
              <div className="mt-2 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--success-soft)] px-3 py-2.5 text-[13px] text-[var(--success)]">
                <Search className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{value.pincodeInfo.displayLocation}</p>
                  <p className="text-[12px] opacity-80 mt-0.5">
                    {value.pincodeInfo.postOffices[0]?.name}
                    {value.pincodeInfo.postOffices.length > 1 &&
                      ` (+${value.pincodeInfo.postOffices.length - 1} more areas)`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {isCustomValid && (
            <>
              <input type="hidden" name="latitude" value={value.pincodeInfo!.latitude} />
              <input type="hidden" name="longitude" value={value.pincodeInfo!.longitude} />
              <input type="hidden" name="location_district" value={value.pincodeInfo!.district} />
              <input type="hidden" name="location_state" value={value.pincodeInfo!.state} />
            </>
          )}
        </div>
      )}

      {(isListValid || isCustomValid) && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Location set — donors within 50 km will be notified</span>
        </div>
      )}
    </div>
  );
}

export function isHospitalLocationValid(value: HospitalLocationValue): boolean {
  if (value.mode === "list") return value.facility !== null;
  return (
    value.customHospitalName.trim().length > 0 && value.pincodeInfo !== null
  );
}
