"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cardData } from "@/lib/cardData";
import Link from "next/link";

const TOTAL_CARDS = 154;

export default function Dashboard() {
  const [ownedCards, setOwnedCards] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("user_cards")
        .select("card_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Supabase error:", error);
      }

      if (data) {
        setOwnedCards(data.map((c) => Number(c.card_id)));
      }
    } catch (err) {
      console.error("Init error:", err);
    }

    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const percent = Math.round(
    (ownedCards.length / TOTAL_CARDS) * 100
  );

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white text-lg animate-pulse">
        Loading Pokédex...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white px-4 py-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            Carddass Dex
          </h1>
          <p className="text-xs text-zinc-400">
            {userEmail || "Not logged in"}
          </p>
        </div>

        {userEmail && (
          <button
            onClick={logout}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg transition"
          >
            Logout
          </button>
        )}
      </div>

      {/* PROGRESS */}
      <div className="mb-6 p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-zinc-300">Collection Progress</p>
          <p className="text-xs text-yellow-400 font-bold">{percent}%</p>
        </div>

        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-xs text-zinc-500 mt-2">
          {ownedCards.length} / {TOTAL_CARDS}
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">

        {cardData.map((card) => {
          const isOwned = ownedCards.includes(card.id);

          return (
            <Link key={card.id} href={`/card/${card.id}`}>
              <div
                className={`relative rounded-xl overflow-hidden transition-all duration-300 transform group
                ${
                  isOwned
                    ? "hover:scale-105 shadow-xl hover:shadow-yellow-400/20"
                    : "opacity-50 grayscale blur-[1px] hover:opacity-80 hover:blur-0"
                }`}
              >

                {/* CARD FRAME */}
                <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-700 rounded-xl p-2">

                  {/* IMAGE */}
                  <div className="aspect-[3/4] bg-black rounded-lg overflow-hidden relative">

                    <img
                      src={card.frontImage}
                      alt={card.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "/fallback.png";
                      }}
                    />

                    {/* LOCKED OVERLAY */}
                    {!isOwned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="text-xs text-white font-bold tracking-widest opacity-80">
                          LOCKED
                        </span>
                      </div>
                    )}

                  </div>

                  {/* DATA BAR */}
                  <div className="mt-2 bg-zinc-800 rounded-md px-2 py-1 flex justify-between items-center">

                    <span className="text-[10px] font-bold text-zinc-300">
                      {String(card.id).padStart(3, "0")}
                    </span>

                    <span className="text-[10px] font-bold text-yellow-400 truncate max-w-[70%]">
                      {card.name}
                    </span>

                  </div>
                </div>

                {/* LEGENDARY EFFECT */}
                {card.rarity === "legendary" && isOwned && (
                  <>
                    <div className="absolute inset-0 rounded-xl border-2 border-purple-400 shadow-purple-500/40 shadow-lg animate-pulse pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-yellow-400/10 pointer-events-none" />
                  </>
                )}

              </div>
            </Link>
          );
        })}

      </div>

      {/* FOOTER */}
      <div className="mt-8 text-center text-xs text-zinc-600">
        1996 Bandai Carddass • Collector Build
      </div>

    </main>
  );
}