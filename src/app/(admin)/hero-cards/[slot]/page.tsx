import { getAllHeroCards } from "@/actions/hero-cards";
import { HeroCardForm } from "@/components/admin/hero-card-form";
import { notFound } from "next/navigation";

const DEFAULT_CONFIGS: Record<number, { title: string; bgColor: string }> = {
  1: { title: "Sony 5G Headphone", bgColor: "#1a1a1a" },
  2: { title: "Air Mavic 3", bgColor: "#00796b" },
  3: { title: "Handheld", bgColor: "#e8ecef" },
  4: { title: "Gearbox", bgColor: "#e8ecef" },
};

export default async function EditHeroCardPage({ params }: { params: Promise<{ slot: string }> }) {
  const { slot: slotStr } = await params;
  const slot = parseInt(slotStr, 10);
  if (isNaN(slot) || slot < 1 || slot > 4) notFound();

  const result = await getAllHeroCards();
  const existing = result.success && result.data ? result.data.find((c) => c.slot === slot) : null;

  const initial = existing ?? {
    slot,
    title: DEFAULT_CONFIGS[slot]?.title ?? "",
    subtitle: null,
    imageUrl: null,
    linkUrl: "/shop",
    bgColor: DEFAULT_CONFIGS[slot]?.bgColor ?? "#1a1a1a",
    isActive: true,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Hero Card — Slot {slot}</h1>
        <p className="text-sm text-gray-500">Upload image and configure hero banner card.</p>
      </div>
      <HeroCardForm initial={initial} />
    </div>
  );
}
