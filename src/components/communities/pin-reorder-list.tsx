"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { reorderCommunityPins, unpinCommunity } from "@/lib/actions/communities";
import { GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Users, Pin, GripVertical } from "lucide-react";

interface PinnedCommunity {
  id: string;
  name: string;
  activeCount: number;
  sort_order: number;
}

export function PinReorderList({ communities }: { communities: PinnedCommunity[] }) {
  const [items, setItems] = useState(communities);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

  function handleLongPressStart(index: number) {
    longPressTimer.current = setTimeout(() => {
      setReorderMode(true);
      setDragIndex(index);
    }, 500);
  }

  function handleLongPressEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  async function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setReorderMode(false);
      return;
    }

    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(targetIndex, 0, moved);
    setItems(newItems);
    setDragIndex(null);
    setReorderMode(false);
    await reorderCommunityPins(newItems.map((i) => i.id));
  }

  async function handleUnpin(id: string) {
    await unpinCommunity(id);
    setItems(items.filter((i) => i.id !== id));
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      {reorderMode && (
        <p className="text-[12px] text-[var(--accent)] px-1 mb-1">
          Drag to reorder pinned communities
        </p>
      )}
      {items.map((c, index) => (
        <div
          key={c.id}
          draggable={reorderMode}
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(index)}
          onTouchStart={() => handleLongPressStart(index)}
          onTouchEnd={handleLongPressEnd}
          onMouseDown={() => handleLongPressStart(index)}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          className={reorderMode && dragIndex === index ? "opacity-50" : ""}
        >
          <GroupedRow href={`/communities/${c.id}`} showChevron>
            {reorderMode && (
              <GripVertical className="h-4 w-4 text-[var(--label-tertiary)] shrink-0 mr-1" />
            )}
            <GroupedRowIcon color="blue">
              <Users className="h-4 w-4" />
            </GroupedRowIcon>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Pin className="h-3 w-3 text-[var(--accent)]" />
                <span className="text-[15px] font-medium text-[var(--label)]">{c.name}</span>
              </div>
              {c.activeCount > 0 && (
                <p className="text-[13px] text-[var(--accent)] mt-0.5">
                  {c.activeCount} active request{c.activeCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {!reorderMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUnpin(c.id);
                }}
                className="text-[12px] text-[var(--label-tertiary)] hover:text-[var(--accent)] px-2"
              >
                Unpin
              </button>
            )}
          </GroupedRow>
        </div>
      ))}
    </div>
  );
}
