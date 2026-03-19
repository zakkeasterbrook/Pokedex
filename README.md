# 🔴 Pokédex Card Scanner
### A Digital Collection System for Physical Trading Cards

An interactive web app for scanning, tracking, and building a digital collection of real-world trading cards.

This project is built to feel like a game while still functioning like a real collector tool — combining front/back scans, condition tracking, grading details, and persistent user collections.

---

## 🚀 Live App

https://pokedex-mu-eight.vercel.app

---

## ⚠️ Current Set Coverage

Right now, this app currently includes **one complete set**:

### **1996 Bandai Carddass Part 1 Green**
This is the **very first Pokémon card set ever released**.

That set is the current foundation of the app and is fully functional right now.

The system is being built so that:
- more sets can be added later by the creator
- other contributors can help add more sets
- the app architecture can grow beyond a single set without needing to be rebuilt

---

## ✨ Core Features

### 🎴 Card Collection System
- Browse a complete card set
- Flip official cards front/back
- Track collected vs uncollected cards
- Locked visual state for cards not yet in your collection
- Set completion tracking
- Global collection progress tracking

### 📸 Poké Scan System
- Live mobile camera capture
- Premium scan overlay
- Front scan + back scan workflow
- Capture → Preview → Save flow
- Retake support
- Restart full scan support
- Native fallback to phone photo picker

### 🗂 Collection Management
- Add cards to your collection
- Re-scan cards cleanly
- Remove cards from your collection
- Removed cards return to locked state in the UI
- Track front and back images separately

### 🏷 Condition + Grading Tracking
- Store card condition
- Auto score logic for ungraded cards
- Mark a card as graded
- Store grading company
- Store cert number
- Save score with each collected card

### 🔐 User-Based Collections
- Every user has their own collection
- Saved with Supabase authentication
- Data persists across sessions
- Collection state is user-specific

### ⚡ Instant UI Updates
- Cache-busting image URLs
- Smooth state transitions
- Immediate collection updates
- Real-time front/back scan preview handling

---

## 🧠 Vision

This project is being built as the foundation of a real collectible platform.

The long-term goal is not just to display cards — it is to create a system where physical cards can be digitally documented, verified, tracked, and eventually enhanced with intelligent tooling.

Planned direction includes:
- additional Pokémon sets
- support for other trading card categories
- AI-powered card recognition
- AI-powered grading assistance
- better condition analysis
- scan validation and image intelligence
- richer collector profiles and tools

---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Backend:** Supabase
  - Auth
  - PostgreSQL
  - Storage
- **Deployment:** Vercel

---

## 📂 Project Structure

```text
app/
  card/[id]/page.tsx      -> Card page + scanner
  dashboard/page.tsx      -> Main collection dashboard
  set/[id]/page.tsx       -> Set view

lib/
  cardData.ts             -> Card dataset
  sets.ts                 -> Set definitions
  supabase.ts             -> Supabase client

public/
  cards/
    front/                -> Official card images (front)
    back/                 -> Official card images (back)
```

---

## 🔐 Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

## 🗄 Supabase Setup

### Table: `user_cards`

```sql
create table user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_id int8 not null,
  image_url text,
  created_at timestamptz default now()
);
```

### Additional columns used by the current collector system

```sql
alter table user_cards
add column if not exists back_image_url text,
add column if not exists condition text,
add column if not exists score numeric,
add column if not exists grading_company text,
add column if not exists cert_number text,
add column if not exists is_graded boolean default false;
```

### Recommended unique index

```sql
create unique index if not exists user_cards_user_card_unique
on user_cards (user_id, card_id);
```

### Storage Bucket

Bucket name:

```text
card-scans
```

Used for:
- front scan uploads
- back scan uploads

---

## 🔒 Recommended Policies

### `user_cards` policies

```sql
create policy "Users can view their own cards"
on user_cards
for select
to authenticated
using (auth.uid() = user_id);
```

```sql
create policy "Users can insert their own cards"
on user_cards
for insert
to authenticated
with check (auth.uid() = user_id);
```

```sql
create policy "Users can update their own cards"
on user_cards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

```sql
create policy "Users can delete their own cards"
on user_cards
for delete
to authenticated
using (auth.uid() = user_id);
```

### `card-scans` storage policies

Public read:

```sql
create policy "Public can view card scans"
on storage.objects
for select
to public
using (bucket_id = 'card-scans');
```

Authenticated users upload only to their own folder:

```sql
create policy "Users can upload their own card scans"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'card-scans'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

Authenticated users delete only from their own folder:

```sql
create policy "Users can delete their own card scans"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'card-scans'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## ⚙️ Local Development

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd pokedex
npm install
npm run dev
```

---

## 🚀 Deployment

### Vercel

```bash
vercel --prod
```

### GitHub + Vercel auto deploy

```bash
git add .
git commit -m "your update message"
git push
```

---

## 🧪 How It Works

1. User selects a card
2. User opens the scanner
3. User scans the front
4. User scans the back
5. Images are uploaded to Supabase Storage
6. Card metadata is saved in `user_cards`
7. The card becomes part of the user’s collection
8. The UI updates immediately

---

## 🔥 Key Engineering Details

### Front + Back Scan Flow
The app supports a two-step scan system:
- front scan first
- back scan second
- final save only after both are captured

### Re-Scan Logic
When a card is replaced:
- new front/back images are uploaded
- database record is updated
- old storage files are removed

### Remove Logic
When a card is removed:
- user row is deleted from `user_cards`
- front/back images are removed from storage
- card returns to locked state in the UI

### Cache Busting
Image URLs use a timestamp query param pattern like:

```ts
image_url + "?t=" + Date.now()
```

This prevents stale image caching after uploads and rescans.

### Mobile Camera Optimization
The app uses:

```ts
facingMode: "environment"
```

to improve rear-camera behavior on mobile devices and falls back to the native photo picker when camera APIs fail.

---

## 🧭 Roadmap

### Near Term
- add more Pokémon sets
- improve collection dashboard stats
- add better badges for condition / graded cards
- improve set-level summaries

### Advanced Features
- AI-powered card detection
- AI-powered condition analysis
- grading assistance
- edge / centering / surface analysis
- card auto-cropping
- real/fake scan assistance

### Long Term
- support many sets and categories
- richer collector identity system
- collection sharing
- collection analytics
- marketplace / trading tools
- deeper metadata and rarity systems

---

## 🤝 Contributing

Contributions are welcome.

This project already works with the current set, and the architecture is intended to grow.

People who want to help can contribute by:
- adding more sets
- improving UI/UX
- improving scan workflow
- expanding grading / metadata tools
- improving collection stats
- helping build future AI features

### Contribution flow

1. Fork the repository
2. Create a branch
3. Make changes
4. Submit a pull request

Please keep contributions:
- clean
- modular
- consistent with the current architecture

---

## ⚠️ Ownership & Credit

Created and maintained by:

**Zakk Easterbrook**

All original architecture, concepts, dataset integration, and collector system implementation originate from the author.

Contributions are welcome, but:
- do not remove attribution
- do not repackage the original work as your own
- do not strip credit from the creator

---

## 📄 License

MIT License

You are free to use and build on this project with proper attribution.

---

## 💥 Final Note

This is not just a viewer.

It is the foundation of a collector system designed to connect:
- physical collectibles
- digital ownership
- scan-based documentation
- future intelligent recognition

It currently starts with **1996 Bandai Carddass Part 1 Green**, the first Pokémon card set ever released, and is designed to grow from there.
