"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();

    // 🔥 listen for login event (instant redirect after magic link)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        window.location.href = "/dashboard";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      window.location.href = "/dashboard";
    }
  };

  const login = async () => {
    if (!email) return;

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // ✅ THIS FIXES LOCALHOST ISSUE
        emailRedirectTo:
          process.env.NEXT_PUBLIC_SITE_URL + "/dashboard",
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email 📧");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-sm bg-zinc-900 p-6 rounded-2xl shadow-lg">

        <h1 className="text-2xl font-bold mb-6 text-center">
          Pokédex Login
        </h1>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 mb-4 rounded-lg bg-zinc-800 text-white outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-yellow-500 text-black font-bold py-3 rounded-xl"
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>

        <p className="text-xs text-zinc-500 mt-4 text-center">
          No password needed — we email you a login link 🔐
        </p>
      </div>
    </main>
  );
}