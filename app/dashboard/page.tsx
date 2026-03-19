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
    try {
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
        // 🔥 IMPORTANT: convert to number
        setOwnedCards(data.map((c) => Number(c.card_id)));
      }
    } catch (err) {
      console.error(err);
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
      <main className="min-h-screen bg-black text-white flex items-center justify-center text-lg animate-pulse">
        Loading Pokédex...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white px-4 py-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
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
      <div className="mb-6 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg">

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
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-700"
            style={{
              width: `${percent}%`,
            }}
          />
        </div>

        <p className="text-xs text-zinc-500 mt-2">
          {ownedCards.length} / {TOTAL_CARDS} cards collected
        </p>
      </div>

      {/* ACTIONS */}
      <div className="grid grid-cols-2 gap-3 mb-6">

        <Link href="/scan">
          <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl shadow-md transition">
            📸 Scan
          </button>
        </Link>

        <button className="w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl transition">
          🔍 Search
        </button>

      </div>

      {/* COLLECTION GRID */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">

        {Array.from({ length: TOTAL_CARDS }, (_, i) => {
          const number = i + 1;
          const isOwned = ownedCards.includes(number);

          return (
            <Link key={number} href={`/card/${number}`}>
              <div
                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200
                ${
                  isOwned
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg scale-100 hover:scale-105"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-600 hover:bg-zinc-800"
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