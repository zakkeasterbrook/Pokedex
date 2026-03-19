"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { sets } from "@/lib/sets";

type UserCardRow = {
  card_id: number | string;
  image_url: string | null;
  back_image_url: string | null;
  condition: string | null;
  score: number | null;
  grading_company: string | null;
  cert_number: string | null;
  is_graded: boolean | null;
};

export default function Dashboard() {
  const [userCards, setUserCards] = useState<UserCardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserCards([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_cards")
      .select(
        "card_id, image_url, back_image_url, condition, score, grading_company, cert_number, is_graded"
      )
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to load collection:", error);
      setUserCards([]);
      setLoading(false);
      return;
    }

    setUserCards(data ?? []);
    setLoading(false);
  };

  const ownedCardIds = useMemo(() => {
    return new Set(userCards.map((c) => Number(c.card_id)));
  }, [userCards]);

  const totalOwned = userCards.length;
  const totalCardsAllSets = sets.reduce((acc, set) => acc + set.totalCards, 0);
  const totalGraded = userCards.filter((c) => Boolean(c.is_graded)).length;

  const globalAverageScore = useMemo(() => {
    const scored = userCards.filter(
      (c) => c.score !== null && c.score !== undefined && !Number.isNaN(Number(c.score))
    );

    if (!scored.length) return 0;

    const total = scored.reduce((sum, c) => sum + Number(c.score), 0);
    return total / scored.length;
  }, [userCards]);

  const globalPercent =
    totalCardsAllSets > 0
      ? Math.round((totalOwned / totalCardsAllSets) * 100)
      : 0;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      {/* HEADER */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Collection</h1>

            <div className="mt-2 text-sm text-zinc-400">
              {totalOwned} / {totalCardsAllSets} cards collected
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-300">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {sets.length} set{sets.length === 1 ? "" : "s"}
              </div>

              <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                {totalGraded} graded
              </div>

              <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-blue-200">
                Avg score: {globalAverageScore > 0 ? globalAverageScore.toFixed(1) : "—"}
              </div>
            </div>
          </div>

          <div className="w-full max-w-md">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
              <span>Overall Completion</span>
              <span>{globalPercent}%</span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200 transition-all duration-700"
                style={{ width: `${globalPercent}%` }}
              />
            </div>

            <div className="mt-1 text-right text-xs text-zinc-500">
              {totalOwned} cards owned
            </div>
          </div>
        </div>
      </div>

      {/* SET GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {sets.map((set) => {
          const setRows = userCards.filter((row) =>
            set.cardIds.includes(Number(row.card_id))
          );

          const ownedCount = setRows.length;
          const gradedCount = setRows.filter((row) => Boolean(row.is_graded)).length;

          const setAverageScore = (() => {
            const scored = setRows.filter(
              (row) =>
                row.score !== null &&
                row.score !== undefined &&
                !Number.isNaN(Number(row.score))
            );

            if (!scored.length) return 0;

            const total = scored.reduce((sum, row) => sum + Number(row.score), 0);
            return total / scored.length;
          })();

          const percent =
            set.totalCards > 0
              ? Math.round((ownedCount / set.totalCards) * 100)
              : 0;

          const isComplete = ownedCount === set.totalCards && set.totalCards > 0;
          const isAlmost = percent >= 90 && !isComplete;

          return (
            <Link key={set.id} href={`/set/${set.id}`}>
              <div
                className={`overflow-hidden rounded-2xl border bg-zinc-900 transition cursor-pointer hover:scale-[1.02] ${
                  isComplete
                    ? "border-yellow-400 shadow-lg shadow-yellow-500/20"
                    : "border-zinc-800"
                } ${isAlmost ? "animate-pulse" : ""}`}
              >
                {/* COVER */}
                <div className="relative aspect-[3/4] bg-black">
                  <img
                    src={set.coverImage}
                    alt={set.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/fallback.png";
                    }}
                  />

                  {isComplete && (
                    <div className="absolute top-2 right-2 rounded bg-yellow-400 px-2 py-1 text-xs text-black">
                      COMPLETE
                    </div>
                  )}

                  {gradedCount > 0 && (
                    <div className="absolute top-2 left-2 rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-1 text-[10px] font-medium text-blue-200 backdrop-blur">
                      {gradedCount} graded
                    </div>
                  )}

                  {ownedCount > 0 && (
                    <div className="absolute inset-x-2 bottom-2 rounded-xl border border-black/20 bg-black/55 px-3 py-2 text-xs backdrop-blur">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-300">Owned</span>
                        <span className="font-semibold text-white">{ownedCount}</span>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-zinc-400">Avg score</span>
                        <span className="text-zinc-100">
                          {setAverageScore > 0 ? setAverageScore.toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="p-3">
                  <h2 className="text-lg font-semibold">{set.name}</h2>

                  <div className="mt-1 text-sm text-zinc-400">
                    {ownedCount} / {set.totalCards} cards
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200 transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>{percent}% complete</span>
                    <span>
                      {gradedCount > 0 ? `${gradedCount} graded` : "No graded cards"}
                    </span>
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