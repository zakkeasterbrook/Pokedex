"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { sets } from "@/lib/sets";
import { cardData } from "@/lib/cardData";
import { supabase } from "@/lib/supabase";

type UserCardMap = Record<
  number,
  {
    image_url: string | null;
    back_image_url: string | null;
    condition: string | null;
    score: number | null;
    grading_company: string | null;
    cert_number: string | null;
    is_graded: boolean | null;
  }
>;

const CONDITION_LABELS: Record<string, string> = {
  gem_mint: "Gem Mint",
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  light_played: "Light Played",
  played: "Played",
  poor: "Poor",
};

export default function SetPage() {
  const params = useParams();

  const rawId = params?.id;
  const setId = Array.isArray(rawId) ? rawId[0] : rawId;

  const set = useMemo(() => {
    return sets.find((s) => s.id === setId);
  }, [setId]);

  const [loading, setLoading] = useState(true);
  const [userCards, setUserCards] = useState<UserCardMap>({});

  const cards = useMemo(() => {
    if (!set) return [];
    return cardData.filter((card) => set.cardIds.includes(card.id));
  }, [set]);

  const ownedCount = useMemo(() => {
    return cards.filter((card) => Boolean(userCards[card.id])).length;
  }, [cards, userCards]);

  const completionPercent = useMemo(() => {
    if (!cards.length) return 0;
    return Math.round((ownedCount / cards.length) * 100);
  }, [ownedCount, cards.length]);

  useEffect(() => {
    const fetchUserCards = async () => {
      if (!set) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserCards({});
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_cards")
        .select(
          "card_id, image_url, back_image_url, condition, score, grading_company, cert_number, is_graded"
        )
        .eq("user_id", user.id)
        .in("card_id", set.cardIds);

      if (error || !data) {
        console.error("Failed to fetch user cards:", error);
        setUserCards({});
        setLoading(false);
        return;
      }

      const nextMap: UserCardMap = {};

      for (const row of data) {
        nextMap[Number(row.card_id)] = {
          image_url: row.image_url ?? null,
          back_image_url: row.back_image_url ?? null,
          condition: row.condition ?? null,
          score:
            row.score !== null && row.score !== undefined
              ? Number(row.score)
              : null,
          grading_company: row.grading_company ?? null,
          cert_number: row.cert_number ?? null,
          is_graded: row.is_graded ?? null,
        };
      }

      setUserCards(nextMap);
      setLoading(false);
    };

    fetchUserCards();
  }, [set]);

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

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6">
      <Link href="/dashboard">
        <button className="mb-4 text-yellow-400 transition hover:text-yellow-300">
          ← Back
        </button>
      </Link>

      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{set.name}</h1>
              <p className="mt-2 text-sm text-zinc-400">
                {ownedCount} / {cards.length} cards collected
              </p>
            </div>

            <div className="w-full max-w-md">
              <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                <span>Set Completion</span>
                <span>{completionPercent}%</span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-white transition-all duration-700"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {cards.map((card) => {
            const owned = userCards[card.id];
            const isOwned = Boolean(owned);

            const displayCondition =
              owned?.condition && CONDITION_LABELS[owned.condition]
                ? CONDITION_LABELS[owned.condition]
                : null;

            const scoreText =
              owned?.score !== null && owned?.score !== undefined
                ? String(owned.score)
                : null;

            return (
              <Link key={card.id} href={`/card/${card.id}`}>
                <div
                  className={`group overflow-hidden rounded-2xl border bg-zinc-900 transition duration-200 ${
                    isOwned
                      ? "border-emerald-500/20 hover:scale-[1.02] hover:border-emerald-400/40"
                      : "border-zinc-800 hover:scale-[1.02] hover:border-zinc-700"
                  }`}
                >
                  {/* IMAGE */}
                  <div className="relative aspect-[3/4] bg-black">
                    <img
                      src={card.frontImage}
                      alt={card.name}
                      className={`h-full w-full object-cover transition duration-300 ${
                        !isOwned ? "grayscale opacity-35 blur-[1px]" : ""
                      }`}
                      onError={(e) => {
                        e.currentTarget.src = "/fallback.png";
                      }}
                    />

                    {/* LOCK OVERLAY */}
                    {!isOwned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                        <span className="rounded-full border border-zinc-500 bg-black/60 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                          LOCKED
                        </span>
                      </div>
                    )}

                    {/* OWNED BADGES */}
                    {isOwned && (
                      <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-300 backdrop-blur">
                            OWNED
                          </span>

                          {owned?.is_graded ? (
                            <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-1 text-[10px] font-medium text-blue-200 backdrop-blur">
                              {owned.grading_company || "GRADED"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {/* BOTTOM SCORE STRIP */}
                    {isOwned && (displayCondition || scoreText) && (
                      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-xl border border-black/20 bg-black/55 px-2 py-1 text-[10px] backdrop-blur">
                        <span className="truncate text-zinc-200">
                          {displayCondition || "Collected"}
                        </span>
                        {scoreText ? (
                          <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-zinc-100">
                            {scoreText}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* TEXT */}
                  <div className="p-2">
                    <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-mono text-zinc-400">
                        #{String(card.displayId).padStart(3, "0")}
                      </span>

                      {isOwned && owned?.cert_number ? (
                        <span className="truncate text-zinc-500">
                          Cert: {owned.cert_number}
                        </span>
                      ) : (
                        <span className="text-zinc-600">
                          {isOwned ? "Collected" : "Not owned"}
                        </span>
                      )}
                    </div>

                    <div
                      className={`truncate text-xs font-medium ${
                        isOwned ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      {card.name}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}