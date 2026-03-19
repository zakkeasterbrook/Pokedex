"use client";

import { useParams } from "next/navigation";
import { sets } from "@/lib/sets";
import { cardData } from "@/lib/cardData";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function SetPage() {
  const params = useParams();

  const rawId = params?.id;
  const setId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [ownedCards, setOwnedCards] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const set = sets.find((s) => s.id === setId);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_cards")
      .select("card_id")
      .eq("user_id", user.id);

    if (data) {
      setOwnedCards(data.map((c) => parseInt(c.card_id)));
    }

    setLoading(false);
  };

  if (!set) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Set not found
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  const cards = cardData.filter((card) =>
    set.cardIds.includes(card.id)
  );

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <Link href="/dashboard">
        <button className="text-yellow-400 mb-4">← Back</button>
      </Link>

      <h1 className="text-2xl font-bold mb-6">{set.name}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">

        {cards.map((card) => {
          const isOwned = ownedCards.includes(card.id);

          return (
            <Link key={card.id} href={`/card/${card.id}`}>
              <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 hover:scale-105 transition">

                {/* IMAGE */}
                <div className="aspect-[3/4] bg-black">
                  <img
                    src={card.frontImage}
                    className={`w-full h-full object-cover transition ${
                      !isOwned
                        ? "grayscale opacity-40"
                        : ""
                    }`}
                    onError={(e) => {
                      e.currentTarget.src = "/fallback.png";
                    }}
                  />
                </div>

                {/* LOCK OVERLAY */}
                {!isOwned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-xs text-zinc-400 border border-zinc-600 px-2 py-1 rounded">
                      LOCKED
                    </span>
                  </div>
                )}

                {/* INFO */}
                <div className="text-[10px] p-1 flex justify-between items-center">

                  {/* NUMBER */}
                  <span className="font-mono text-zinc-400 tracking-widest">
                    {String(card.displayId).padStart(3, "0")}
                  </span>

                  {/* ✅ ALWAYS SHOW NAME */}
                  <span
                    className={`truncate ${
                      !isOwned ? "text-zinc-500" : "text-white"
                    }`}
                  >
                    {card.name}
                  </span>

                </div>

              </div>
            </Link>
          );
        })}

      </div>

    </main>
  );
}