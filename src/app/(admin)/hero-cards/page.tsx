import Link from "next/link";
import { getAllHeroCards } from "@/actions/hero-cards";
import { Pencil } from "lucide-react";
import { requireAdminRole } from "@/lib/permissions";

const SLOT_LABELS: Record<number, string> = {
  1: "Large Left Banner",
  2: "Top-Right Banner",
  3: "Bottom-Right Small (Left)",
  4: "Bottom-Right Small (Right)",
};

export default async function HeroCardsPage() {
  await requireAdminRole();
  const result = await getAllHeroCards();
  const cards = result.success && result.data ? result.data : [];

  const allSlots = [1, 2, 3, 4].map((slot) => ({
    slot,
    card: cards.find((c) => c.slot === slot) ?? null,
  }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hero Cards</h1>
        <p className="text-sm text-gray-500">Manage the 4 hero banner cards on the store homepage.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {allSlots.map(({ slot, card }) => (
          <div key={slot} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div
              className="flex h-36 items-center justify-center text-white relative overflow-hidden"
              style={{ backgroundColor: card?.bgColor ?? "#1a1a1a" }}
            >
              {card?.imageUrl && (
                <img src={card.imageUrl} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
              )}
              <div className="relative z-10 text-center px-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Slot {slot}</p>
                <p className="mt-1 text-[15px] font-bold leading-snug">{card?.title ?? "(not set)"}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[11px] font-semibold text-gray-500">{SLOT_LABELS[slot]}</p>
              <p className="mt-0.5 text-xs text-gray-400">{card?.subtitle ?? "No subtitle"}</p>
              <div className="mt-3">
                <Link
                  href={`/hero-cards/${slot}`}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="size-3.5" />
                  {card ? "Edit" : "Set up"}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
