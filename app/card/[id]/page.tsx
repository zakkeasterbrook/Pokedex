"use client";

import { useState } from "react";
import Link from "next/link";
import { cardData } from "@/lib/cardData";

export default function CardPage({
  params,
}: {
  params: { id?: string };
}) {
  // ✅ SAFE ID PARSING (FINAL FIX)
  const rawId = params?.id;
  const id = rawId ? parseInt(rawId, 10) : NaN;

  if (isNaN(id)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Invalid card ID
      </main>
    );
  }

  const card = cardData.find((c) => c.id === id);

  if (!card) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Card not found
      </main>
    );
  }

  const [flipped, setFlipped] = useState(false);

  // 🔥 NAVIGATION
  const prevId = id <= 1 ? 154 : id - 1;
  const nextId = id >= 154 ? 1 : id + 1;

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <Link href="/dashboard">
          <button className="text-sm text-yellow-400 hover:opacity-80 transition">
            ← Back
          </button>
        </Link>

        <div className="flex gap-3 text-xs">

          <Link href={`/card/${prevId}`}>
            <button className="bg-zinc-800 px-3 py-1 rounded-lg hover:bg-zinc-700">
              ← Prev
            </button>
          </Link>

          <Link href={`/card/${nextId}`}>
            <button className="bg-zinc-800 px-3 py-1 rounded-lg hover:bg-zinc-700">
              Next →
            </button>
          </Link>

        </div>
      </div>

      <div className="flex flex-col items-center">

        {/* CARD */}
        <div
          onClick={() => setFlipped(!flipped)}
          className="w-[260px] h-[380px] perspective cursor-pointer group"
        >
          <div
            className={`relative w-full h-full transition-transform duration-700 ${
              flipped ? "rotate-y-180" : ""
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >

            {/* FRONT */}
            <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden">

              <div className="w-full h-full relative bg-gradient-to-br from-green-200 via-green-300 to-green-500 p-2 border border-zinc-700">

                {/* BACKGROUND TEXT */}
                <div className="absolute inset-0 opacity-10 text-[22px] font-bold text-black flex flex-col justify-center items-center pointer-events-none select-none">
                  <p>POCKET MONSTERS</p>
                  <p>MONSTERS COLLECTION</p>
                </div>

                {/* INNER */}
                <div className="relative w-full h-full bg-white/95 rounded-md p-2 shadow-inner flex flex-col justify-between">

                  {/* HEADER */}
                  <div className="text-[10px] text-zinc-600 font-bold flex justify-between">
                    <span>POCKET MONSTERS</span>
                    <span>{String(card.id).padStart(3, "0")}</span>
                  </div>

                  {/* IMAGE */}
                  <div className="flex-1 flex items-center justify-center my-2">
                    <div className="w-full h-full bg-white rounded-md overflow-hidden flex items-center justify-center">
                      <img
                        src={card.frontImage}
                        alt={card.name}
                        className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "/fallback.png";
                        }}
                      />
                    </div>
                  </div>

                  {/* NAME */}
                  <div className="bg-zinc-200 text-black text-[10px] font-bold px-2 py-1 flex justify-between">
                    <span className="truncate">{card.name}</span>
                    <span className="text-zinc-500">#{card.id}</span>
                  </div>

                  {/* FOOTER */}
                  <div className="text-[8px] text-center text-zinc-500 mt-1">
                    MONSTERS COLLECTION • 1996 BANDAI
                  </div>

                </div>

                {/* LEGENDARY */}
                {card.rarity === "legendary" && (
                  <>
                    <div className="absolute inset-0 rounded-xl border-2 border-yellow-400 shadow-yellow-400/50 shadow-xl pointer-events-none animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/10 to-purple-500/10 pointer-events-none" />
                  </>
                )}

              </div>
            </div>

            {/* BACK */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden"
              style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
              }}
            >
              <img
                src={card.backImage}
                alt="Card Back"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/fallback.png";
                }}
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>

          </div>
        </div>

        {/* INFO */}
        <div className="mt-6 text-center">
          <h2 className="text-xl font-bold">{card.name}</h2>
          <p className="text-xs text-zinc-400">
            Card #{card.id} • {card.rarity}
          </p>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Tap card to flip
        </p>

      </div>

      {/* 3D */}
      <style jsx>{`
        .perspective {
          perspective: 1200px;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>

    </main>
  );
}