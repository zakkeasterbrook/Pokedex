"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { sets } from "@/lib/sets";

export default function Dashboard() {
  const [ownedCards, setOwnedCards] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

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
      setOwnedCards(data.map((c) => Number(c.card_id)));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  const totalOwned = ownedCards.length;
  const totalCardsAllSets = sets.reduce((acc, set) => acc + set.totalCards, 0);
  const globalPercent =
    totalCardsAllSets > 0
      ? Math.round((totalOwned / totalCardsAllSets) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Collection</h1>

        <div className="text-zinc-400 mt-2 text-sm">
          {totalOwned} / {totalCardsAllSets} cards collected
        </div>

        <div className="w-full h-3 bg-zinc-800 rounded mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200 transition-all duration-700"
            style={{ width: `${globalPercent}%` }}
          />
        </div>

        <div className="text-xs text-right mt-1 text-zinc-500">
          {globalPercent}% complete
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {sets.map((set) => {
          const ownedCount = set.cardIds.filter((id) =>
            ownedCards.includes(id)
          ).length;

          const percent =
            set.totalCards > 0
              ? Math.round((ownedCount / set.totalCards) * 100)
              : 0;

          const isComplete = ownedCount === set.totalCards;
          const isAlmost = percent >= 90 && !isComplete;

          return (
            <Link key={set.id} href={`/set/${set.id}`}>
              <div
                className={`rounded-2xl overflow-hidden border bg-zinc-900 transition cursor-pointer hover:scale-105 ${
                  isComplete
                    ? "border-yellow-400 shadow-lg shadow-yellow-500/20"
                    : "border-zinc-800"
                } ${isAlmost ? "animate-pulse" : ""}`}
              >
                <div className="aspect-[3/4] bg-black relative">
                  <img
                    src={set.coverImage}
                    alt={set.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/fallback.png";
                    }}
                  />

                  {isComplete && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                      COMPLETE
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h2 className="text-lg font-semibold">{set.name}</h2>

                  <div className="text-sm text-zinc-400 mt-1">
                    {ownedCount} / {set.totalCards} cards
                  </div>

                  <div className="w-full h-2 bg-zinc-800 rounded mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200 transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="text-xs text-right mt-1 text-zinc-500">
                    {percent}% complete
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}