"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { cardData } from "@/lib/cardData";

type ScanStatus = "idle" | "loading" | "ready" | "preview" | "uploading";

export default function CardPage() {
  const params = useParams();

  const rawId = params?.id;
  const id = Array.isArray(rawId)
    ? parseInt(rawId[0], 10)
    : rawId
      ? parseInt(rawId, 10)
      : NaN;

  const card = useMemo(() => cardData.find((c) => c.id === id), [id]);

  const [flipped, setFlipped] = useState(false);
  const [userCard, setUserCard] = useState<string | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rarityGlow =
    card?.rarity === "legendary"
      ? "shadow-yellow-400/40"
      : card?.rarity === "rare"
        ? "shadow-blue-400/30"
        : card?.rarity === "promo"
          ? "shadow-pink-400/30"
          : "";

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  const cleanupPreview = (url?: string | null) => {
    const target = url ?? capturedPreview;
    if (target?.startsWith("blob:")) {
      URL.revokeObjectURL(target);
    }
  };

  const extractPathFromStorageUrl = (url: string) => {
    const cleanUrl = url.split("?")[0];
    const marker = "/card-scans/";
    const idx = cleanUrl.indexOf(marker);
    if (idx === -1) return null;
    return cleanUrl.slice(idx + marker.length);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {}
      video.srcObject = null;
    }

    setCameraOpen(false);
    setScanStatus("idle");
    setCameraError(null);
  };

  const resetCapture = () => {
    cleanupPreview();
    setCapturedBlob(null);
    setCapturedPreview(null);
    setScanStatus("ready");
  };

  useEffect(() => {
    return () => {
      stopCamera();
      cleanupPreview();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchUserCard = async () => {
      if (!card || Number.isNaN(id)) {
        setLoadingCard(false);
        return;
      }

      setLoadingCard(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadingCard(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_cards")
        .select("image_url")
        .eq("user_id", user.id)
        .eq("card_id", id)
        .maybeSingle();

      if (!error && data?.image_url) {
        setUserCard(data.image_url);
      } else {
        setUserCard(null);
      }

      setLoadingCard(false);
    };

    fetchUserCard();
  }, [card, id]);

  const fileFromBlob = (blob: Blob) =>
    new File([blob], `card-${id}-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

  const uploadCardFile = async (file: File) => {
    if (!card) return;

    setScanStatus("uploading");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setScanStatus("idle");
      showToast("You need to be logged in.");
      return;
    }

    if (userCard) {
      const oldPath = extractPathFromStorageUrl(userCard);
      if (oldPath) {
        const { error: removeError } = await supabase.storage
          .from("card-scans")
          .remove([oldPath]);

        if (removeError) {
          console.warn("Old image remove warning:", removeError);
        }
      }
    }

    const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filePath = `${user.id}/${card.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("card-scans")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setScanStatus("idle");
      showToast("Upload failed.");
      return;
    }

    const { data: publicData } = supabase.storage
      .from("card-scans")
      .getPublicUrl(filePath);

    const finalUrl = `${publicData.publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase.from("user_cards").upsert(
      {
        user_id: user.id,
        card_id: card.id,
        image_url: finalUrl,
      },
      {
        onConflict: "user_id,card_id",
      }
    );

    if (dbError) {
      console.error("DB error:", dbError);
      setScanStatus("idle");
      showToast("Saved image, but collection update failed.");
      return;
    }

    setUserCard(finalUrl);
    cleanupPreview();
    setCapturedBlob(null);
    setCapturedPreview(null);
    stopCamera();
    showToast(userCard ? "🔥 Card re-scanned!" : "🔥 Card added to collection!");
  };

  const openNativeFallback = () => {
    fallbackInputRef.current?.click();
  };

  const startCamera = async () => {
    setCameraError(null);
    setCapturedBlob(null);
    cleanupPreview();
    setCapturedPreview(null);
    setCameraOpen(true);
    setScanStatus("loading");

    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error("Camera API unavailable");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;

      await video.play();

      setScanStatus("ready");
    } catch (err) {
      console.error("Camera start failed:", err);
      stopCamera();
      setCameraError(
        "Camera couldn’t open here. Using your phone’s camera picker instead."
      );
      openNativeFallback();
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      showToast("Camera not ready yet.");
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      showToast("Could not capture image.");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    setFlash(true);
    setTimeout(() => setFlash(false), 130);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast("Capture failed.");
          return;
        }

        cleanupPreview();
        const previewUrl = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedPreview(previewUrl);
        setScanStatus("preview");
      },
      "image/jpeg",
      0.92
    );
  };

  const confirmCapturedUpload = async () => {
    if (!capturedBlob) return;
    await uploadCardFile(fileFromBlob(capturedBlob));
  };

  const handleFallbackFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadCardFile(file);
  };

  if (Number.isNaN(id)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Invalid card ID
      </main>
    );
  }

  if (!card) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Card not found
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6">
      <input
        ref={fallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFallbackFile}
      />

      {toast && (
        <div className="fixed top-4 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-white/10 bg-zinc-900/95 px-4 py-2 text-sm shadow-xl backdrop-blur">
          {toast}
        </div>
      )}

      {flash && (
        <div className="pointer-events-none fixed inset-0 z-[90] bg-white/85" />
      )}

      <Link href="/dashboard">
        <button className="mb-4 text-yellow-400 transition hover:text-yellow-300">
          ← Back
        </button>
      </Link>

      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-start">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center">
          <div
            onClick={() => setFlipped(!flipped)}
            className={`w-[260px] h-[380px] perspective cursor-pointer rounded-2xl shadow-2xl transition hover:scale-[1.01] ${rarityGlow}`}
          >
            <div
              className={`relative h-full w-full transition-transform duration-700 ${
                flipped ? "rotate-y-180" : ""
              }`}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="absolute inset-0 backface-hidden">
                <img
                  src={card.frontImage}
                  alt={card.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              </div>

              <div
                className="absolute inset-0"
                style={{
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden",
                }}
              >
                <img
                  src={card.backImage}
                  alt={`${card.name} back`}
                  className="h-full w-full rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="font-mono text-sm tracking-[0.2em] text-zinc-400">
              #{String(card.displayId).padStart(3, "0")}
            </div>

            <h2 className="mt-1 text-2xl font-semibold">{card.name}</h2>

            <div className="mt-1 text-xs capitalize text-zinc-500">
              {card.type} • {card.rarity}
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/70 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Your Collection Scan</h3>
              <p className="text-sm text-zinc-400">
                Add your own photo of this card and replace it anytime.
              </p>
            </div>

            {userCard && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                Collected
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
            <div className="relative aspect-[3/4] w-full">
              {loadingCard ? (
                <div className="flex h-full items-center justify-center text-zinc-500">
                  Loading...
                </div>
              ) : userCard ? (
                <img
                  src={userCard}
                  alt={`Your ${card.name} scan`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-zinc-950 to-zinc-900 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl">
                    📸
                  </div>
                  <div>
                    <p className="font-medium">No scan yet</p>
                    <p className="text-sm text-zinc-500">
                      Capture this card to add it to your collection.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {cameraError && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {cameraError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={startCamera}
              disabled={
                scanStatus === "uploading" || scanStatus === "loading"
              }
              className="rounded-2xl bg-gradient-to-r from-red-500 via-white to-red-500 p-[1px] transition hover:scale-[1.01] disabled:opacity-60"
            >
              <span className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 font-semibold">
                <span className="text-lg">🔴</span>
                {userCard ? "Re-scan Card" : "Open Poké Scan"}
              </span>
            </button>

            <label className="cursor-pointer rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-center font-medium transition hover:border-white/20 hover:bg-zinc-800">
              Upload from Photos
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFallbackFile}
              />
            </label>
          </div>

          <p className="text-xs text-zinc-500">
            Best results: place the card on a dark surface, fill the frame, and avoid glare.
          </p>
        </div>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 z-[70] bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/20" />

          <div className="absolute left-1/2 top-6 z-10 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-center backdrop-blur">
            <div className="text-sm font-semibold">Poké Scan</div>
            <div className="mt-1 text-xs text-zinc-300">
              Center the card inside the frame and tap capture.
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="relative w-full max-w-sm">
              <div className="aspect-[3/4] rounded-[2rem] border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-white/90" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] border-black bg-white shadow-lg" />
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-3xl bg-gradient-to-t from-black via-black/95 to-transparent px-6 pb-8 pt-20">
            {scanStatus === "preview" && capturedPreview ? (
              <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                  <img
                    src={capturedPreview}
                    alt="Captured preview"
                    className="max-h-[42vh] w-full object-cover"
                  />
                </div>

                <div className="grid w-full grid-cols-2 gap-3">
                  <button
                    onClick={resetCapture}
                    disabled={scanStatus === "uploading"}
                    className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 font-medium disabled:opacity-60"
                  >
                    Retake
                  </button>

                  <button
                    onClick={confirmCapturedUpload}
                    disabled={scanStatus === "uploading"}
                    className="rounded-2xl bg-yellow-400 px-4 py-3 font-semibold text-black disabled:opacity-60"
                  >
                    {scanStatus === "uploading" ? "Saving..." : "Use This Scan"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex max-w-md items-center justify-between gap-4">
                <button
                  onClick={stopCamera}
                  disabled={scanStatus === "uploading"}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  onClick={capturePhoto}
                  disabled={scanStatus !== "ready"}
                  className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-red-500 shadow-2xl transition active:scale-95 disabled:opacity-60"
                >
                  <span className="absolute h-7 w-7 rounded-full border-4 border-black bg-white" />
                </button>

                <button
                  onClick={openNativeFallback}
                  disabled={scanStatus === "uploading"}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm disabled:opacity-60"
                >
                  Photos
                </button>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

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