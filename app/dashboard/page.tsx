"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUserEmail(user.email ?? null);

    const { data } = await supabase
      .from("user_cards")
      .select("card_id")
      .eq("user_id", user.id);

    if (data) {
      setOwnedCards(data.map((c) => Number(c.card_id)));
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
            Pokédex
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

      {/* PROGRESS CARD */}
      <div className="mb-6 p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-zinc-300">
            Collection Progress
          </p>
          <p className="text-xs text-yellow-400 font-bold">
            {percent}%
          </p>
        </div>

        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-xs text-zinc-500 mt-2">
          {ownedCards.length} / {TOTAL_CARDS} cards collected
        </p>
      </div>

      {/* ACTIONS */}
      <div className="grid grid-cols-2 gap-3 mb-6">

        <Link href="/scan">
          <button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95">
            📸 Scan Card
          </button>
        </Link>

        <button className="w-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 py-3 rounded-xl transition">
          🔍 Search
        </button>

      </div>

      {/* GRID */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">

        {Array.from({ length: TOTAL_CARDS }, (_, i) => {
          const number = i + 1;
          const isOwned = ownedCards.includes(number);

          return (
            <Link key={number} href={`/card/${number}`}>
              <div
                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 transform
                ${
                  isOwned
                    ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-black shadow-xl hover:scale-110 hover:shadow-yellow-500/50"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-600 hover:bg-zinc-800 hover:scale-105"
                }`}
              >
                {isOwned ? number : "—"}
              </div>
            </Link>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="mt-8 text-center text-xs text-zinc-600">
        1996 Bandai Carddass • Green Set
      </div>

    </main>
  );
}