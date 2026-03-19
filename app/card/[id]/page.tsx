"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { cardData } from "@/lib/cardData";

type ScanStatus = "idle" | "loading" | "ready" | "preview" | "uploading";
type ScanStep = "front" | "back";

type UserCardRow = {
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

const CONDITION_OPTIONS = [
  { value: "gem_mint", label: "Gem Mint", score: 10 },
  { value: "mint", label: "Mint", score: 9 },
  { value: "near_mint", label: "Near Mint", score: 8 },
  { value: "excellent", label: "Excellent", score: 7 },
  { value: "light_played", label: "Light Played", score: 6 },
  { value: "played", label: "Played", score: 5 },
  { value: "poor", label: "Poor", score: 3 },
] as const;

const GRADE_OPTIONS = [
  "10",
  "9.5",
  "9",
  "8.5",
  "8",
  "7.5",
  "7",
  "6.5",
  "6",
  "5.5",
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2.5",
  "2",
  "1.5",
  "1",
] as const;

export default function CardPage() {
  const params = useParams();

  const rawId = params?.id;
  const id = Array.isArray(rawId)
    ? parseInt(rawId[0], 10)
    : rawId
      ? parseInt(rawId, 10)
      : NaN;

  const card = useMemo(() => cardData.find((c) => c.id === id), [id]);

  // official card flip
  const [flipped, setFlipped] = useState(false);

  // user scan flip
  const [userFlipped, setUserFlipped] = useState(false);

  // current saved user scans
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);

  // metadata
  const [condition, setCondition] = useState<string>("mint");
  const [score, setScore] = useState<string>("9");
  const [isGraded, setIsGraded] = useState(false);
  const [gradingCompany, setGradingCompany] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");

  // camera / scan flow
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<ScanStep>("front");

  // captured preview before saving
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // temporary front during 2-step scan flow
  const [pendingFrontBlob, setPendingFrontBlob] = useState<Blob | null>(null);
  const [pendingFrontPreview, setPendingFrontPreview] = useState<string | null>(
    null
  );

  // ui
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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

  const hasSavedCard = Boolean(frontImage);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  };

  const cleanupUrl = (url?: string | null) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  const cleanupPreviews = () => {
    cleanupUrl(capturedPreview);
    cleanupUrl(pendingFrontPreview);
  };

  const extractPathFromStorageUrl = (url: string) => {
    const cleanUrl = url.split("?")[0];
    const marker = "/card-scans/";
    const idx = cleanUrl.indexOf(marker);
    if (idx === -1) return null;
    return cleanUrl.slice(idx + marker.length);
  };

  const getConditionBaseScore = (value: string) => {
    const found = CONDITION_OPTIONS.find((c) => c.value === value);
    return found ? String(found.score) : "9";
  };

  const resetMetadataToDefault = () => {
    setCondition("mint");
    setScore("9");
    setIsGraded(false);
    setGradingCompany("");
    setCertNumber("");
    setPurchasePrice("");
    setPurchaseDate("");
  };

  const resetEntireScanFlow = () => {
    cleanupPreviews();
    setCapturedBlob(null);
    setCapturedPreview(null);
    setPendingFrontBlob(null);
    setPendingFrontPreview(null);
    setScanStep("front");
    setScanStatus("ready");
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
    setCapturedBlob(null);
    cleanupUrl(capturedPreview);
    setCapturedPreview(null);
    setPendingFrontBlob(null);
    cleanupUrl(pendingFrontPreview);
    setPendingFrontPreview(null);
    setScanStep("front");
  };

  useEffect(() => {
    return () => {
      stopCamera();
      cleanupPreviews();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isGraded) {
      setScore(getConditionBaseScore(condition));
      setGradingCompany("");
      setCertNumber("");
    }
  }, [condition, isGraded]);

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
        .select(
          "image_url, back_image_url, condition, score, grading_company, cert_number, is_graded, purchase_price, purchase_date"
        )
        .eq("user_id", user.id)
        .eq("card_id", id)
        .maybeSingle<UserCardRow>();

      if (!error && data) {
        setFrontImage(data.image_url ?? null);
        setBackImage(data.back_image_url ?? null);
        setCondition(data.condition ?? "mint");
        setIsGraded(Boolean(data.is_graded));
        setScore(
          data.score !== null && data.score !== undefined
            ? String(data.score)
            : getConditionBaseScore(data.condition ?? "mint")
        );
        setGradingCompany(data.grading_company ?? "");
        setCertNumber(data.cert_number ?? "");
        setPurchasePrice(
          data.purchase_price !== null && data.purchase_price !== undefined
            ? String(data.purchase_price)
            : ""
        );
        setPurchaseDate(data.purchase_date ?? "");
      } else {
        setFrontImage(null);
        setBackImage(null);
        resetMetadataToDefault();
      }

      setLoadingCard(false);
    };

    fetchUserCard();
  }, [card, id]);

  const fileFromBlob = (blob: Blob, namePrefix: string) =>
    new File([blob], `${namePrefix}-${id}-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

  const deleteStoredImageIfExists = async (url: string | null) => {
    if (!url) return;
    const path = extractPathFromStorageUrl(url);
    if (!path) return;

    const { error } = await supabase.storage.from("card-scans").remove([path]);
    if (error) {
      console.warn("Storage remove warning:", error);
    }
  };

  const saveCardRecord = async (
    frontUrl: string,
    backUrl: string | null,
    options?: {
      replacing?: boolean;
    }
  ) => {
    if (!card) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast("You need to be logged in.");
      return false;
    }

    const parsedScore = Number(score);
    const parsedPurchasePrice =
      purchasePrice.trim() === "" ? null : Number(purchasePrice);
    const normalizedPurchaseDate =
      purchaseDate.trim() === "" ? null : purchaseDate.trim();

    if (
      parsedPurchasePrice !== null &&
      (!Number.isFinite(parsedPurchasePrice) || parsedPurchasePrice < 0)
    ) {
      showToast("Enter a valid purchase price.");
      return false;
    }

    const { error: dbError } = await supabase.from("user_cards").upsert(
      {
        user_id: user.id,
        card_id: card.id,
        image_url: frontUrl,
        back_image_url: backUrl,
        condition,
        score: Number.isFinite(parsedScore) ? parsedScore : null,
        grading_company: isGraded ? gradingCompany.trim() || null : null,
        cert_number: isGraded ? certNumber.trim() || null : null,
        is_graded: isGraded,
        purchase_price: parsedPurchasePrice,
        purchase_date: normalizedPurchaseDate,
      },
      {
        onConflict: "user_id,card_id",
      }
    );

    if (dbError) {
      console.error("DB error:", dbError);
      showToast("Saved image, but collection update failed.");
      return false;
    }

    setFrontImage(frontUrl);
    setBackImage(backUrl);
    showToast(options?.replacing ? "🔥 Card re-scanned!" : "🔥 Card added!");
    return true;
  };

  const uploadSingleFile = async (file: File, side: "front" | "back") => {
    if (!card) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast("You need to be logged in.");
      return null;
    }

    const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filePath = `${user.id}/${card.id}-${side}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("card-scans")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error(`${side} upload error:`, uploadError);
      showToast(`Upload failed (${side}).`);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from("card-scans")
      .getPublicUrl(filePath);

    return `${publicData.publicUrl}?t=${Date.now()}`;
  };

  const uploadCardPair = async (frontFile: File, backFile: File) => {
    if (!card) return;

    setScanStatus("uploading");

    const replacing = Boolean(frontImage || backImage);
    const oldFront = frontImage;
    const oldBack = backImage;

    const frontUrl = await uploadSingleFile(frontFile, "front");
    if (!frontUrl) {
      setScanStatus("ready");
      return;
    }

    const backUrl = await uploadSingleFile(backFile, "back");
    if (!backUrl) {
      await deleteStoredImageIfExists(frontUrl);
      setScanStatus("ready");
      return;
    }

    const saved = await saveCardRecord(frontUrl, backUrl, { replacing });

    if (!saved) {
      await deleteStoredImageIfExists(frontUrl);
      await deleteStoredImageIfExists(backUrl);
      setScanStatus("ready");
      return;
    }

    if (replacing) {
      await deleteStoredImageIfExists(oldFront);
      await deleteStoredImageIfExists(oldBack);
    }

    cleanupPreviews();
    setCapturedBlob(null);
    setCapturedPreview(null);
    setPendingFrontBlob(null);
    setPendingFrontPreview(null);
    stopCamera();
  };

  const removeFromCollection = async () => {
    if (!card) return;

    setIsRemoving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showToast("You need to be logged in.");
        setIsRemoving(false);
        return;
      }

      const oldFront = frontImage;
      const oldBack = backImage;

      const { error: deleteError } = await supabase
        .from("user_cards")
        .delete()
        .eq("user_id", user.id)
        .eq("card_id", card.id);

      if (deleteError) {
        console.error("Delete row error:", deleteError);
        showToast("Could not remove card.");
        setIsRemoving(false);
        return;
      }

      await deleteStoredImageIfExists(oldFront);
      await deleteStoredImageIfExists(oldBack);

      setFrontImage(null);
      setBackImage(null);
      setUserFlipped(false);
      resetMetadataToDefault();
      showToast("❌ Card removed from collection.");
    } finally {
      setIsRemoving(false);
    }
  };

  const openNativeFallback = () => {
    fallbackInputRef.current?.click();
  };

  const startCamera = async () => {
    setCameraError(null);
    cleanupPreviews();
    setCapturedBlob(null);
    setCapturedPreview(null);
    setPendingFrontBlob(null);
    setPendingFrontPreview(null);
    setScanStep("front");
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

        cleanupUrl(capturedPreview);
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

    if (scanStep === "front") {
      cleanupUrl(pendingFrontPreview);
      setPendingFrontBlob(capturedBlob);
      setPendingFrontPreview(capturedPreview);
      setCapturedBlob(null);
      setCapturedPreview(null);
      setScanStep("back");
      setScanStatus("ready");
      showToast("Now scan the back.");
      return;
    }

    if (!pendingFrontBlob) {
      showToast("Front image missing. Start over.");
      cleanupPreviews();
      setCapturedBlob(null);
      setCapturedPreview(null);
      setPendingFrontBlob(null);
      setPendingFrontPreview(null);
      setScanStep("front");
      setScanStatus("ready");
      return;
    }

    const frontFile = fileFromBlob(pendingFrontBlob, "front");
    const backFile = fileFromBlob(capturedBlob, "back");
    await uploadCardPair(frontFile, backFile);
  };

  const retakeCurrentStep = () => {
    cleanupUrl(capturedPreview);
    setCapturedBlob(null);
    setCapturedPreview(null);
    setScanStatus("ready");
  };

  const restartWholeScan = () => {
    resetEntireScanFlow();
    showToast("Scan restarted.");
  };

  const handleFallbackFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (scanStep === "front") {
      cleanupUrl(pendingFrontPreview);
      const url = URL.createObjectURL(file);
      setPendingFrontBlob(file);
      setPendingFrontPreview(url);
      setScanStep("back");
      setScanStatus("ready");
      showToast("Front selected. Now choose the back.");
      return;
    }

    if (!pendingFrontBlob) {
      showToast("Choose the front first.");
      setScanStep("front");
      return;
    }

    await uploadCardPair(
      fileFromBlob(pendingFrontBlob, "front"),
      fileFromBlob(file, "back")
    );
  };

  const formatCurrencyPreview = (value: string) => {
    if (!value.trim()) return "—";
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatDatePreview = (value: string) => {
    if (!value.trim()) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
        {/* LEFT SIDE */}
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

        {/* RIGHT SIDE */}
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/70 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Your Collection Scan</h3>
              <p className="text-sm text-zinc-400">
                Scan front + back, track condition, grading details, price paid,
                and purchase date.
              </p>
            </div>

            {hasSavedCard && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                Collected
              </span>
            )}
          </div>

          {/* USER CARD PREVIEW */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
            <div className="relative aspect-[3/4] w-full">
              {loadingCard ? (
                <div className="flex h-full items-center justify-center text-zinc-500">
                  Loading...
                </div>
              ) : hasSavedCard ? (
                <button
                  type="button"
                  onClick={() => setUserFlipped(!userFlipped)}
                  className="h-full w-full"
                >
                  <img
                    src={
                      userFlipped
                        ? backImage || frontImage || ""
                        : frontImage || ""
                    }
                    alt={`Your ${card.name} scan`}
                    className="h-full w-full object-cover"
                  />
                </button>
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

          {/* TEMP FRONT/BACK STATUS */}
          {(pendingFrontPreview || capturedPreview || cameraOpen) && (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
              <div className="text-sm font-semibold">Scan Progress</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="mb-2 text-zinc-400">Front</div>
                  {pendingFrontPreview || frontImage ? (
                    <div className="text-emerald-300">Captured</div>
                  ) : (
                    <div className="text-zinc-500">Waiting</div>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="mb-2 text-zinc-400">Back</div>
                  {scanStep === "back" && !capturedPreview && !backImage ? (
                    <div className="text-yellow-300">Next step</div>
                  ) : backImage ? (
                    <div className="text-emerald-300">Captured</div>
                  ) : (
                    <div className="text-zinc-500">Waiting</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {cameraError}
            </div>
          )}

          {/* CONDITION + GRADE */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Card Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
              >
                {CONDITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="mt-3 text-xs text-zinc-500">
                Ungraded cards use this condition to estimate a score.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <input
                  type="checkbox"
                  checked={isGraded}
                  onChange={(e) => setIsGraded(e.target.checked)}
                  className="h-4 w-4"
                />
                Graded Card
              </label>

              <label className="mb-2 block text-sm text-zinc-400">
                Score
              </label>
              <select
                value={score}
                onChange={(e) => setScore(e.target.value)}
                disabled={!isGraded}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none disabled:opacity-60"
              >
                {isGraded
                  ? GRADE_OPTIONS.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))
                  : null}
                {!isGraded && (
                  <option value={getConditionBaseScore(condition)}>
                    {getConditionBaseScore(condition)}
                  </option>
                )}
              </select>

              <div className="mt-3 text-xs text-zinc-500">
                {isGraded
                  ? "Use the slab grade."
                  : "Ungraded score is auto-based on condition."}
              </div>
            </div>
          </div>

          {isGraded && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Grading Company
                </label>
                <select
                  value={gradingCompany}
                  onChange={(e) => setGradingCompany(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Select company</option>
                  <option value="PSA">PSA</option>
                  <option value="CGC">CGC</option>
                  <option value="TAG">TAG</option>
                  <option value="BGS">BGS</option>
                  <option value="SGC">SGC</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Cert Number
                </label>
                <input
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  placeholder="Enter cert number"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* PURCHASE DETAILS */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Price Paid
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-8 pr-3 text-sm outline-none"
                />
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                Used for total collection value on the dashboard.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
              />
              <div className="mt-3 text-xs text-zinc-500">
                Keep track of when you picked up the card.
              </div>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
            <div className="text-sm font-semibold">Card Details</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-zinc-500">Condition</div>
                <div className="mt-1 font-medium">
                  {CONDITION_OPTIONS.find((c) => c.value === condition)?.label ??
                    "Mint"}
                </div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-zinc-500">Score</div>
                <div className="mt-1 font-medium">{score}</div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-zinc-500">Graded</div>
                <div className="mt-1 font-medium">{isGraded ? "Yes" : "No"}</div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-zinc-500">Company</div>
                <div className="mt-1 font-medium">
                  {isGraded ? gradingCompany || "—" : "—"}
                </div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-zinc-500">Paid</div>
                <div className="mt-1 font-medium">
                  {formatCurrencyPreview(purchasePrice)}
                </div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-zinc-500">Date</div>
                <div className="mt-1 font-medium">
                  {formatDatePreview(purchaseDate)}
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={startCamera}
              disabled={
                scanStatus === "uploading" ||
                scanStatus === "loading" ||
                isRemoving
              }
              className="rounded-2xl bg-gradient-to-r from-red-500 via-white to-red-500 p-[1px] transition hover:scale-[1.01] disabled:opacity-60"
            >
              <span className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 font-semibold">
                <span className="text-lg">🔴</span>
                {hasSavedCard ? "Re-scan Card" : "Open Poké Scan"}
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

            <button
              onClick={removeFromCollection}
              disabled={!hasSavedCard || isRemoving || scanStatus === "uploading"}
              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {isRemoving ? "Removing..." : "Remove Card"}
            </button>
          </div>

          <p className="text-xs text-zinc-500">
            Best results: place the card on a dark surface, fill the frame, and
            avoid glare. Scan front first, then back.
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
            <div className="text-sm font-semibold">
              Poké Scan — {scanStep === "front" ? "Front Side" : "Back Side"}
            </div>
            <div className="mt-1 text-xs text-zinc-300">
              {scanStep === "front"
                ? "Center the FRONT of the card inside the frame and tap capture."
                : "Now center the BACK of the card and tap capture."}
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
                    onClick={retakeCurrentStep}
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
                    {scanStatus === "uploading"
                      ? "Saving..."
                      : scanStep === "front"
                        ? "Use Front Scan"
                        : "Use Back Scan"}
                  </button>
                </div>

                {pendingFrontPreview && scanStep === "back" && (
                  <button
                    onClick={restartWholeScan}
                    className="text-sm text-zinc-400 underline"
                  >
                    Restart full scan
                  </button>
                )}
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