"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ScanPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/identify", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.card_id) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("user_cards").insert({
        user_id: user?.id,
        card_id: data.card_id,
      });

      alert("Card added: " + data.card_id);
    }

    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Scan Card</h1>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileRef}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
      />

      {loading && <p>Scanning...</p>}
    </div>
  );
}