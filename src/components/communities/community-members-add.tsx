"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addCommunityMemberByUserId,
  searchCommunityMemberCandidates,
  type CommunityMemberSearchResult,
} from "@/lib/actions/communities";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommunityMembersAddButton({ communityId }: { communityId: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommunityMemberSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const runSearch = useCallback(
    async (q: string) => {
      setSearchError("");
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      const result = await searchCommunityMemberCandidates(communityId, q);
      if (result.error) {
        setSearchError(result.error);
        setResults([]);
      } else {
        setResults(result.results ?? []);
      }
      setSearching(false);
    },
    [communityId]
  );

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      void runSearch(query);
    }, 300);
    return () => clearTimeout(t);
  }, [open, query, runSearch]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSearchError("");
      setMessage("");
    }
  }, [open]);

  async function handleAdd(user: CommunityMemberSearchResult) {
    setAddingId(user.id);
    setMessage("");
    const result = await addCommunityMemberByUserId(communityId, user.id);
    if (result.error) {
      setMessage(result.error);
      setAddingId(null);
      return;
    }
    setMessage(`${user.name} added to the group`);
    setAddingId(null);
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Add member"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          "bg-[#007aff] text-white shadow-[var(--shadow-sm)]",
          "transition-transform hover:bg-[#0066d6] active:scale-95"
        )}
      >
        <Plus className="h-5 w-5 stroke-[2.5]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close add member"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
            className={cn(
              "relative z-10 flex max-h-[min(85dvh,560px)] w-full flex-col",
              "rounded-t-[20px] bg-[var(--surface)] shadow-[var(--shadow-lg)]",
              "sm:max-w-md sm:rounded-[var(--radius-xl)]"
            )}
          >
            <div className="flex items-center justify-between border-b border-[var(--separator)] px-4 py-3.5">
              <h2 id="add-member-title" className="text-[17px] font-semibold text-[var(--label)]">
                Add member
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--label-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-[var(--separator)] px-4 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--label-tertiary)]" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or email"
                  className="border border-[var(--separator)] bg-[var(--surface-secondary)] pl-10"
                />
              </div>
              <p className="mt-2 text-[12px] text-[var(--label-secondary)]">
                Active BloodLink users who are not already in this group
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {searching && (
                <div className="flex items-center justify-center gap-2 py-10 text-[14px] text-[var(--label-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </div>
              )}
              {!searching && query.trim().length < 2 && (
                <p className="px-2 py-8 text-center text-[14px] text-[var(--label-secondary)]">
                  Type at least 2 characters to search
                </p>
              )}
              {!searching && query.trim().length >= 2 && results.length === 0 && !searchError && (
                <p className="px-2 py-8 text-center text-[14px] text-[var(--label-secondary)]">
                  No matching users found
                </p>
              )}
              {searchError && (
                <p className="px-2 py-4 text-center text-[14px] text-[var(--accent)]">{searchError}</p>
              )}
              {results.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2.5 hover:bg-[var(--surface-secondary)]"
                >
                  <EntityAvatar id={user.id} name={user.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-[var(--label)]">{user.name}</p>
                    <p className="truncate text-[13px] text-[var(--label-secondary)]">{user.email}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="tinted"
                    disabled={addingId === user.id}
                    onClick={() => handleAdd(user)}
                  >
                    {addingId === user.id ? "…" : "Add"}
                  </Button>
                </div>
              ))}
            </div>

            {message && (
              <p className="border-t border-[var(--separator)] px-4 py-3 text-[13px] text-[var(--label-secondary)]">
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
