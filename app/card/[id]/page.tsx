"use client";

import { useState } from "react";
import Link from "next/link";
import { cardData } from "@/lib/cardData";

export default function CardPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params?.id || "0");
  const card = cardData.find((c) => c.id === id);

  const [flipped, setFlipped] = useState(false);

  if (!card || isNaN(id)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Card not found
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-6">

      {/* BACK BUTTON */}
      <Link href="/dashboard">
        <button className="mb-4 text-sm text-yellow-400">
          ← Back
        </button>
      </Link>

      <div className="flex flex-col items-center">

        {/* CARD */}
        <div
          onClick={() => setFlipped(!flipped)}
          className="w-[260px] h-[380px] perspective cursor-pointer"
        >
          <div
            className={`relative w-full h-full transition-transform duration-700 ${
              flipped ? "rotate-y-180" : ""
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >

            {/* ================= FRONT ================= */}
            <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden">

              <div className="w-full h-full relative bg-gradient-to-br from-green-200 via-green-300 to-green-500 p-2 border border-zinc-700">

                {/* FADED TEXT */}
                <div className="absolute inset-0 opacity-10 text-[22px] font-bold text-black flex flex-col justify-center items-center pointer-events-none select-none">
                  <p>POCKET MONSTERS</p>
                  <p>MONSTERS COLLECTION</p>
                </div>

                {/* CARD FRAME */}
                <div className="relative w-full h-full bg-white/90 rounded-md p-2 shadow-inner flex flex-col justify-between">

                  {/* TOP */}
                  <div className="text-[10px] text-zinc-600 font-bold flex justify-between">
                    <span>POCKET MONSTERS</span>
                    <span>{String(card.id).padStart(3, "0")}</span>
                  </div>

                  {/* IMAGE */}
                  <div className="flex-1 flex items-center justify-center my-2">
                    <div className="w-full h-full bg-white rounded-md overflow-hidden flex items-center justify-center">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="object-contain w-full h-full"
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

                {/* LEGENDARY GLOW */}
                {card.rarity === "legendary" && (
                  <div className="absolute inset-0 rounded-xl border-2 border-yellow-400 shadow-yellow-400/40 shadow-lg pointer-events-none" />
                )}

              </div>
            </div>

            {/* ================= BACK ================= */}
            <div
              className="absolute inset-0 bg-white text-black border border-zinc-700 rounded-xl p-3 rotate-y-180"
              style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
              }}
            >

              <div className="h-full flex flex-col justify-between">

                {/* HEADER */}
                <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 flex justify-between">
                  <span>POCKET MONSTERS</span>
                  <span>{String(card.id).padStart(3, "0")}</span>
                </div>

                {/* DATA */}
                <div className="mt-1">

                  <div className="bg-blue-500 text-white text-[10px] px-2 py-1 font-bold mb-1">
                    DATA
                  </div>

                  <div className="flex gap-2">

                    {/* MINI IMAGE */}
                    <div className="w-16 h-16 bg-zinc-200 flex items-center justify-center">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* INFO */}
                    <div className="text-[10px] leading-tight">
                      <p className="font-bold">{card.name}</p>
                      <p>Type: {card.type}</p>
                      <p>Height: 0.{card.id}m</p>
                      <p>Weight: {card.id}kg</p>
                    </div>

                  </div>

                  {/* DESCRIPTION */}
                  <div className="mt-2 text-[9px] leading-tight">
                    A mysterious Pokémon. Data collected from field research across multiple regions.
                  </div>

                </div>

                {/* STATS */}
                <div className="mt-2 flex justify-between items-center">

                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-green-500 flex items-center justify-center text-[10px] font-bold">
                      {card.id % 100}%
                    </div>
                    <span className="text-[8px] mt-1">GREEN</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-red-500 flex items-center justify-center text-[10px] font-bold">
                      {(card.id * 2) % 100}%
                    </div>
                    <span className="text-[8px] mt-1">RED</span>
                  </div>

                </div>

                {/* FOOTER */}
                <div className="text-[8px] text-center text-zinc-500 mt-2">
                  ©1996 BANDAI • MADE IN JAPAN
                </div>

              </div>
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
          perspective: 1000px;
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