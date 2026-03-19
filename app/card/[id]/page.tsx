"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function CardPage() {
  const params = useParams();
  const id = params.id;

  return (
    <main className="min-h-screen bg-black text-white p-6">

      {/* BACK */}
      <Link href="/dashboard">
        <button className="mb-4 text-sm text-yellow-400">
          ← Back
        </button>
      </Link>

      {/* CARD */}
      <div className="bg-zinc-900 p-6 rounded-2xl text-center">

        <h1 className="text-2xl font-bold mb-2">
          Card #{id}
        </h1>

        <div className="h-40 bg-zinc-800 rounded-xl mb-4 flex items-center justify-center">
          🃏 Image coming soon
        </div>

        <p className="text-zinc-400 text-sm">
          1996 Bandai Carddass
        </p>

      </div>

    </main>
  );
}