# 🔴 Pokédex Card Scanner
### A Digital Collection System for Physical Trading Cards

An interactive web app that allows users to scan, track, and build a digital collection of real-world trading cards.

Built to feel like a game — powered by real data and real user collections.

---

## 🚀 Live App

https://pokedex-mu-eight.vercel.app

---

## ✨ Core Features

### 🎴 Card Collection System
- Browse a full card set (Bandai Carddass – current)
- Flip cards (front/back)
- Visual collection tracking
- Greyed-out vs collected state

---

### 📸 Poké Scan (Camera System)
- Live camera capture
- Frame overlay for alignment
- Capture → Preview → Save flow
- Retake support
- Mobile optimized
- Fallback to device photo upload

---

### 🔁 Re-Scan System
- Replace existing card scans seamlessly
- Automatically deletes old image from storage
- Prevents duplicates and storage bloat

---

### 🔐 User-Based Collections
- Each user has their own collection
- Stored securely via Supabase
- Real-time UI updates after scanning

---

### ⚡ Instant UI Updates
- Cache-busting image system
- No stale images
- Smooth transitions + feedback

---

## 🧠 Vision

This project is evolving into a next-generation collectible platform:

- Scan real cards → build a digital collection
- Introduce AI-powered recognition
- Add grading + condition analysis
- Expand into multiple sets and categories

---

## 🛠 Tech Stack

- Frontend: Next.js (App Router)
- Styling: Tailwind CSS
- Backend: Supabase (Auth, PostgreSQL, Storage)
- Deployment: Vercel

---

## 📂 Project Structure

app/
  card/[id]/page.tsx      → Card page + scanner
  dashboard/              → Collection view

lib/
  cardData.ts             → Card dataset
  supabase.ts             → Supabase client

public/
  cards/
    front/                → Card images (front)
    back/                 → Card images (back)

---

## 🔐 Environment Setup

Create a `.env.local` file:

NEXT_PUBLIC_SUPABASE_URL=your_url  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key  

---

## 🗄 Supabase Setup

### Table: user_cards

create table user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_id int8 not null,
  image_url text,
  created_at timestamptz default now()
);

### Storage Bucket

card-scans

- Must be public
- Used for storing user card images

---

## ⚙️ Local Development

git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git  
cd pokedex  
npm install  
npm run dev  

---

## 🚀 Deployment

vercel --prod  

OR  

git push  

---

## 🧪 How It Works

1. User selects a card  
2. Opens scanner  
3. Captures image  
4. Image uploads to Supabase Storage  
5. URL saved in database  
6. UI updates instantly  

---

## 🔥 Key Engineering Details

### Clean Re-Scan Logic
- Extracts storage path from URL
- Deletes old image before upload
- Prevents duplication

### Cache Busting
image_url + "?t=" + Date.now()

### Mobile Camera Optimization
- Uses facingMode: "environment"
- Avoids device compatibility issues
- Fallback to native photo picker

---

## 🧭 Roadmap

### Near Term
- Multiple card sets support
- Collection progress tracking
- Improved dashboard UX

### Advanced Features
- AI-powered card detection
- Condition analysis + grading
- Scan validation (real vs fake)
- Smart cropping / auto-detection
- Card recognition via camera

### Long Term
- Full digital collectible identity system
- Cross-set tracking
- Trading / sharing features
- Advanced rarity + metadata layers

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository  
2. Create a new branch  
3. Submit a pull request  

Keep contributions clean, modular, and consistent.

---

## ⚠️ Ownership & Credit

Created and maintained by:

Zakk Easterbrook

All core architecture, concepts, and implementations originate from the author.

Do not remove attribution or repackage as original work.

---

## 📄 License

MIT License

---

## 💥 Final Note

This is not just a viewer — it’s the foundation of a system.

A system designed to connect:
- Physical collectibles  
- Digital ownership  
- Intelligent recognition  

Built to scale far beyond a single set.
