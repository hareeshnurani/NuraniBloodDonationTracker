"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FACILITIES,
  FACILITY_CITIES,
  FACILITY_TYPE_LABELS,
  searchFacilities,
  type Facility,
} from "@/lib/facilities";
import { Building2, Droplets, MapPin, Search, X } from "lucide-react";

interface FacilityPickerProps {
  onSelect: (facility: Facility | null) => void;
  defaultFacilityId?: string;
  required?: boolean;
  includeHiddenFields?: boolean;
}

export function FacilityPicker({
  onSelect,
  defaultFacilityId,
  required = true,
  includeHiddenFields = true,
}: FacilityPickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultFacilityId) {
      const facility = FACILITIES.find((f) => f.id === defaultFacilityId);
      if (facility) {
        setSelected(facility);
        setQuery(facility.name);
        onSelect(facility);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultFacilityId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (selected) setQuery(selected.name);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  const results = query.trim() ? searchFacilities(query) : FACILITIES;

  const groupedResults = FACILITY_CITIES.reduce<Record<string, Facility[]>>((acc, city) => {
    const cityFacilities = results.filter((f) => f.city === city);
    if (cityFacilities.length > 0) acc[city] = cityFacilities;
    return acc;
  }, {});

  function handleSelect(facility: Facility) {
    setSelected(facility);
    setQuery(facility.name);
    setOpen(false);
    onSelect(facility);
  }

  function handleClear() {
    setSelected(null);
    setQuery("");
    onSelect(null);
    setOpen(true);
  }

  function handleInputChange(value: string) {
    setQuery(value);
    setOpen(true);
    if (selected && value !== selected.name) {
      setSelected(null);
      onSelect(null);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--label-tertiary)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search hospital or blood bank..."
          className="w-full rounded-[var(--radius-md)] bg-[var(--surface-secondary)] py-3 pl-10 pr-10 text-[15px] text-[var(--label)] placeholder:text-[var(--label-tertiary)] transition-all focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          autoComplete="off"
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--label-tertiary)] hover:bg-[var(--surface-secondary)]"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1.5 max-h-72 w-full overflow-y-auto rounded-[var(--radius-md)] border border-[var(--separator)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-[14px] text-[var(--label-secondary)]">
              No hospitals or blood banks found
            </p>
          ) : (
            Object.entries(groupedResults).map(([city, cityFacilities]) => (
              <div key={city}>
                <p className="sticky top-0 bg-[var(--surface-secondary)] px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--label-secondary)]">
                  {city}
                </p>
                {cityFacilities.map((facility) => (
                  <button
                    key={facility.id}
                    type="button"
                    onClick={() => handleSelect(facility)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-secondary)] active:bg-[#ebebf0]",
                      selected?.id === facility.id && "bg-[var(--accent-soft)]"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]",
                        facility.type === "hospital"
                          ? "bg-[#007aff1a] text-[#007aff]"
                          : "bg-[var(--accent-soft)] text-[var(--accent)]"
                      )}
                    >
                      {facility.type === "hospital" ? (
                        <Building2 className="h-4 w-4" />
                      ) : (
                        <Droplets className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-[var(--label)]">{facility.name}</p>
                      <p className="text-[13px] text-[var(--label-secondary)]">
                        {FACILITY_TYPE_LABELS[facility.type]}
                      </p>
                      <p className="text-[12px] text-[var(--label-tertiary)] truncate">{facility.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {selected && (
        <div className="mt-2 flex items-center gap-2 text-[13px] text-[var(--success)]">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>
            {selected.name}, {selected.city} — donors within 50 km will be notified
          </span>
        </div>
      )}

      {includeHiddenFields && (
        <>
          <input type="hidden" name="facility_id" value={selected?.id ?? ""} required={required} />
          <input type="hidden" name="latitude" value={selected?.latitude ?? ""} required={required} />
          <input type="hidden" name="longitude" value={selected?.longitude ?? ""} required={required} />
          <input type="hidden" name="facility_name" value={selected?.name ?? ""} />
        </>
      )}
    </div>
  );
}
