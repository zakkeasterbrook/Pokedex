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
  purchase_price: number | null;
  purchase_date: string | null;
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
        "card_id, image_url, back_image_url, condition, score, grading_company, cert_number, is_graded, purchase_price, purchase_date"
      )
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to load collection:", error);
      setUserCards([]);
      setLoading(false);
      return;
    }

    setUserCards((data ?? []) as UserCardRow[]);
    setLoading(false);
  };

  const totalOwned = userCards.length;
  const totalCardsAllSets = sets.reduce((acc, set) => acc + set.totalCards, 0);
  const totalGraded = userCards.filter((c) => Boolean(c.is_graded)).length;

  const totalCollectionValue = useMemo(() => {
    return userCards.reduce((sum, card) => {
      const price =
        card.purchase_price !== null && card.purchase_price !== undefined
          ? Number(card.purchase_price)
          : 0;

      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);
  }, [userCards]);

  const globalAverageScore = useMemo(() => {
    const scored = userCards.filter(
      (c) =>
        c.score !== null &&
        c.score !== undefined &&
        !Number.isNaN(Number(c.score))
    );

    if (!scored.length) return 0;

    const total = scored.reduce((sum, c) => sum + Number(c.score), 0);
    return total / scored.length;
  }, [userCards]);

  const latestPurchaseDate = useMemo(() => {
    const dated = userCards
      .map((c) => c.purchase_date)
      .filter(Boolean)
      .sort()
      .reverse();

    if (!dated.length) return null;

    const date = new Date(`${dated[0]}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [userCards]);

  const globalPercent =
    totalCardsAllSets > 0
      ? Math.round((totalOwned / totalCardsAllSets) * 100)
      : 0;

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      {/* HERO / GLOBAL HEADER */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-2xl backdrop-blur">
        <div className="bg-gradient-to-r from-yellow-500/10 via-transparent to-emerald-500/10 p-5 sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-yellow-300">
                First Pokémon Card Set
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                My Collection
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                This collection currently includes{" "}
                <span className="font-semibold text-white">
                  1996 Bandai Carddass Part 1 Green
                </span>
                , the very first Pokémon cards ever released. The system is
                already built to support more sets as the collection grows.
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-300">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {sets.length} set{sets.length === 1 ? "" : "s"}
                </div>

                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                  {totalOwned} owned
                </div>

                <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-blue-200">
                  {totalGraded} graded
                </div>

                <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-purple-200">
                  Avg score: {globalAverageScore > 0 ? globalAverageScore.toFixed(1) : "—"}
                </div>
              </div>
            </div>

            <div className="w-full max-w-xl">
              <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                <span>Overall Completion</span>
                <span>{globalPercent}%</span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-white transition-all duration-700"
                  style={{ width: `${globalPercent}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {totalOwned} / {totalCardsAllSets} cards collected
                </span>
                <span>
                  {totalCardsAllSets - totalOwned > 0
                    ? `${totalCardsAllSets - totalOwned} remaining`
                    : "Set complete"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GLOBAL STATS */}
        <div className="grid grid-cols-2 gap-3 border-t border-white/5 p-5 sm:grid-cols-4 sm:p-6">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Collection Value
            </div>
            <div className="mt-2 text-xl font-semibold text-emerald-300 sm:text-2xl">
              {formatCurrency(totalCollectionValue)}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Based on your recorded purchase prices
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Cards Owned
            </div>
            <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">
              {totalOwned}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Across all active sets
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Graded Cards
            </div>
            <div className="mt-2 text-xl font-semibold text-blue-200 sm:text-2xl">
              {totalGraded}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Slabbed / certified entries
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Latest Purchase
            </div>
            <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">
              {latestPurchaseDate ?? "—"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Most recent recorded pickup
            </div>
          </div>
        </div>
      </div>

      {/* SET GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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

          const setValue = setRows.reduce((sum, row) => {
            const price =
              row.purchase_price !== null && row.purchase_price !== undefined
                ? Number(row.purchase_price)
                : 0;

            return sum + (Number.isFinite(price) ? price : 0);
          }, 0);

          const percent =
            set.totalCards > 0
              ? Math.round((ownedCount / set.totalCards) * 100)
              : 0;

          const isComplete = ownedCount === set.totalCards && set.totalCards > 0;
          const isAlmost = percent >= 90 && !isComplete;

          return (
            <Link key={set.id} href={`/set/${set.id}`}>
              <div
                className={`group overflow-hidden rounded-2xl border bg-zinc-900 transition duration-300 cursor-pointer hover:scale-[1.02] ${
                  isComplete
                    ? "border-yellow-400 shadow-lg shadow-yellow-500/20"
                    : "border-zinc-800 hover:border-zinc-700"
                } ${isAlmost ? "animate-pulse" : ""}`}
              >
                {/* COVER */}
                <div className="relative aspect-[3/4] bg-black">
                  <img
                    src={set.coverImage}
                    alt={set.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
                    onError={(e) => {
                      e.currentTarget.src = "/fallback.png";
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {isComplete && (
                    <div className="absolute top-2 right-2 rounded-full bg-yellow-400 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-black">
                      COMPLETE
                    </div>
                  )}

                  {gradedCount > 0 && (
                    <div className="absolute top-2 left-2 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-[10px] font-medium text-blue-200 backdrop-blur">
                      {gradedCount} graded
                    </div>
                  )}

                  {ownedCount > 0 && (
                    <div className="absolute inset-x-2 bottom-2 rounded-2xl border border-black/20 bg-black/60 px-3 py-3 text-xs backdrop-blur">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-300">Owned</span>
                        <span className="font-semibold text-white">
                          {ownedCount}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-zinc-400">Avg score</span>
                        <span className="text-zinc-100">
                          {setAverageScore > 0 ? setAverageScore.toFixed(1) : "—"}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-zinc-400">Value</span>
                        <span className="font-medium text-emerald-300">
                          {formatCurrency(setValue)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="p-4">
                  <h2 className="text-lg font-semibold">{set.name}</h2>

                  <div className="mt-1 text-sm text-zinc-400">
                    {ownedCount} / {set.totalCards} cards
                  </div>

                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-white transition-all duration-700"
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