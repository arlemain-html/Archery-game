# Product Requirement Document (PRD): GameFi Archery Web3

## 1. Executive Summary
GameFi Archery adalah sebuah Decentralized Application (dApp) berbasis browser yang memadukan gameplay memanah (archery) kompetitif yang kasual dengan teknologi Web3. Produk ini berfokus pada kepemilikan aset digital yang sebenarnya (NFT) dan validasi pencapaian secara on-chain (Soulbound Tokens/SBT). Untuk memastikan aksesibilitas, kecepatan, dan biaya rendah (gasless gameplay), seluruh inti mekanik game dan perhitungan fisika akan berjalan secara off-chain, sementara blockchain secara eksklusif digunakan untuk transaksi Shop, koleksi kosmetik, dan rekaman pencapaian permanen.

## 2. Product Vision
Menciptakan ekosistem game Web3 yang *fun-first* dan *skill-based*, di mana pemain tidak bisa sekadar "membayar untuk menang" (No Pay-to-Win). Visi utama adalah membuktikan bahwa teknologi blockchain dapat diintegrasikan sebagai lapisan ekonomi dan identitas yang *seamless*, memberikan nilai nyata bagi dedikasi dan keterampilan pemain melalui ekonomi kosmetik yang kuat dan pencapaian yang tidak dapat dipalsukan.

## 3. Target User
- **Web3 Gamers & Crypto Enthusiasts**: Pemain yang mencari kepemilikan aset dan identitas on-chain.
- **Casual & Competitive Browser Gamers**: Pengguna yang mencari game ringan namun memiliki tingkat kompetisi yang tinggi, tanpa harus mengunduh aplikasi besar.
- **NFT Collectors & Achievement Hunters**: Pengguna yang gemar mengoleksi barang kosmetik langka dan memamerkan pencapaian (bragging rights).

## 4. Gameplay Design
Pemain baru yang login menggunakan wallet akan otomatis menerima **Default Bow** (off-chain item) yang tidak dapat diperjualbelikan, agar dapat langsung bermain.
Permainan difokuskan pada akurasi, kecepatan, dan penyesuaian terhadap variabel lingkungan (misal: arah angin, jarak).

### Mode 1: Single Player / Practice
Pemain berlatih menembak target statis maupun bergerak untuk mengumpulkan skor, membangun statistik akurasi, menyelesaikan *daily quest*, dan membuka *Achievement* dasar. Mode ini digunakan untuk *onboarding* pemain dan mendapatkan perkembangan (progression) secara gratis.

### Mode 2: PvP (Player vs Player)
Pemain bertanding satu lawan satu melawan pemain lain untuk memperebutkan peringkat (Rank). 
**Rekomendasi MVP**: **Ghost Replay**. Pendekatan ini paling optimal untuk MVP GameFi berbasis browser karena memberikan pengalaman kompetitif layaknya real-time tanpa risiko *matchmaking timeout* dan *network lag*, memastikan retensi pemain tetap tinggi di awal rilis.

## 5. Core Game Loop & UI/User Flow

### Core Game Loop
1. **Entry & Preparation**: Pemain melakukan *Connect Wallet*, masuk ke Dashboard, mengecek *Inventory*, dan melengkapi (equip) *Bow* serta *Arrow Skin* favorit.
2. **Action (Gameplay)**: Pemain memilih mode *PvP*. Sistem melakukan *matchmaking* seketika melawan rekaman *Ghost* pemain lain. Pemain menembakkan panah dalam 3-5 ronde.
3. **Calculation & Reward**: Skor dihitung oleh server. Menang/kalah menentukan perubahan *ELO Rating*, serta memberikan *Soft Currency* (Off-chain) dan *XP*.
4. **Sink & Upgrade**: Pemain menggunakan *Soft Currency* atau Crypto di *Shop* untuk membeli/membuat *Skin* baru, atau menyelesaikan misi untuk melakukan klaim SBT Achievement.
5. **Loop**: Kembali ke aksi (PvP) dengan kosmetik dan peringkat yang lebih tinggi.

### UI/User Flow
- **Landing Page**: Pengenalan game $\rightarrow$ Tombol *Connect Wallet*.
- **Main Dashboard**: Menampilkan karakter/avatar 3D dengan *equipment* saat ini, Level, Saldo Currency. Terdapat menu navigasi: `Play`, `Shop`, `Profile`, `Leaderboard`, `Season Pass`.
- **Play Flow**: Klik `Play` $\rightarrow$ Pilih Mode (Practice/PvP) $\rightarrow$ Layar Loading (Mengunduh *Ghost Data*) $\rightarrow$ **Game Canvas (Gameplay)** $\rightarrow$ Layar *Result* (Menang/Kalah, Perubahan ELO, XP Gain) $\rightarrow$ Kembali ke Dashboard.
- **Shop Flow**: Klik `Shop` $\rightarrow$ Lihat *Featured Items* $\rightarrow$ Klik Beli (Memicu transaksi dompet Web3 untuk item NFT, atau potong saldo internal untuk item Soft Currency) $\rightarrow$ Animasi *Gacha/Unboxing* $\rightarrow$ Masuk Inventory.

## 6. Feature Breakdown

### Equipment & Inventory Flow
- **Flow Sinkronisasi**: Ketika pemain membeli NFT di *marketplace* sekunder, *Web3 Indexer* pada backend mendeteksi *event* transfer dan menambahkannya ke *Database Inventory* pemain.
- **Equip Flow**:
  1. Pemain membuka tab *Inventory* di menu *Profile*.
  2. Memilih *Bow Skin* dan menekan tombol `Equip`.
  3. API Backend memperbarui tabel *Inventory* (`is_equipped = true`).
  4. Saat memasuki pertandingan, Game Engine akan me- *request* data *loadout* dan hanya me- *render* aset 3D yang memiliki status *equipped*.

### Shop & Item (NFT & Off-chain)
* **Kategori Item**: Bow Skin, Arrow Skin, Cosmetic Effect (efek partikel), Target Hit Effect, Banner, Avatar, Emote.
* **Rarity & Capped Supply**: 
  - *Common / Uncommon*: Suplai tidak terbatas (Off-chain, dibeli dengan Soft Currency).
  - *Rare*: Suplai terbatas per musim (NFT, 10.000 supply).
  - *Epic*: Sangat terbatas (NFT, 1.000 supply).
  - *Legendary*: Edisi kolektor (NFT, 100 supply).
* **Crafting & Merging (Item Sink)**: Pemain dapat melakukan *burning* pada 5 buah item *Common* untuk mendapatkan 1 *Uncommon*, dst. Untuk *merging* item NFT, dilakukan *burning* on-chain via *Smart Contract*.

### Achievement & Soulbound Token (SBT)
SBT digunakan untuk memvalidasi *skill* secara permanen di blockchain. SBT tidak dapat ditransfer (Non-transferable).
* **Proses Verifikasi & Minting**:
  1. Server mendeteksi pemain memenuhi syarat (contoh: *10x win streak*).
  2. Server menghasilkan *cryptographic signature* (EIP-712).
  3. Pemain menekan "Claim", mengirim transaksi dengan *signature*.
  4. Contract memverifikasi *signature* dan *nonce*, lalu mencetak SBT.

### Profile Data Structure
Menyimpan ID (UUID Primary Key), Wallet Address (Unique Constraint), Username, Avatar URL/NFT, Level, XP, Statistik (Win/Loss, Accuracy), *Equipped Items*, dan Koleksi SBT.

### Rank System
**Sistem ELO dipadukan dengan Visual League** (Bronze, Silver, Gold, Platinum, Diamond, Master). Pemain mencocokkan lawan berdasarkan "Hidden ELO", namun antarmuka menampilkan pencapaian *League* untuk psikologis pemain.

### History & Analytics
Menyimpan dan menampilkan log pertandingan (Lawan, Skor, Akurasi) serta metrik personal pemain seperti *Win Rate*, *Average Score*, dan waktu bermain.

## 7. Menu Specification
1. **Start Game / Play**: Pemilihan mode Practice atau PvP.
2. **Rank / Leaderboard**: Klasemen Global dan Teman yang diperbarui *real-time*.
3. **History & Analytics**: Catatan historis pertandingan dan grafik performa.
4. **Shop & Crafting**: Etalase pembelian item Web3, item *Soft Currency*, dan sistem *Merging*.
5. **Profile & Inventory**: Manajemen identitas dan pergantian *loadout* kosmetik.
6. **Season Pass**: Halaman untuk mengklaim hadiah dari progresi musiman.

## 8. Game Economy & Monetization

Ekonomi murni berbasis kosmetik. Semua atribut *Bow* dan *Arrow* identik secara mekanik agar **100% Bebas Pay-to-Win**.

### Monetization Plan
1. **Primary NFT Sales**: Penjualan *Lootbox* kosmetik, *Battle Pass / Season Pass* premium, dan penjualan edisi terbatas langsung dari developer.
2. **Secondary Market Royalties**: Memungut *creator fee* (misal 5%) pada setiap perdagangan NFT pemain di pasar sekunder (OpenSea, Blur).
3. **Season Pass (Premium Track)**: Pemain dapat membeli *Premium Pass* menggunakan kripto/fiat untuk membuka jalur hadiah kosmetik eksklusif selama satu musim.
4. **Crafting & Convenience Fees**: Biaya kecil (menggunakan token) untuk mempercepat proses *crafting* atau *merging* item kosmetik.
5. **Tournament Entry Fees (Future)**: Memungut sebagian kecil biaya masuk dari turnamen *high-stakes*.

## 9. Season & Progression System
* **Struktur Season**: 1 Season berlangsung selama 1 Bulan (30 hari).
* **Progression (Season Pass)**: Sistem poin *Battle Pass* (Level 1 - 50). Setiap pertandingan memberikan *Pass XP*. Terdapat *Free Track* (hadiah Soft Currency, item Common) dan *Premium Track* (hadiah NFT, Emote eksklusif).
* **ELO Reset**: Di akhir musim, ELO Rating akan di-*soft reset* (misalnya kembali ke rata-rata tier) agar kompetisi tetap segar di musim berikutnya.
* **End of Season Rewards**: Top 100 pemain di Leaderboard menerima *SBT Seasonal Champion* eksklusif dan *Airdrop* NFT langka.

## 10. Blockchain Architecture
* **On-chain Data**: Kepemilikan aset kosmetik premium, *Achievement SBT*, dan transaksi *Shop*.
* **Off-chain Data**: Profil pengguna, *ELO Rating*, fisika gameplay, *Inventory* dasar, dan *Season Pass XP*. 

## 11. Smart Contract Planning (Arsitektur)
1. **Shop Contract**: Mengelola *pricing*, menerima pembayaran, dan memicu *Item Contract*.
2. **Item Contract (ERC-1155)**: Representasi kosmetik standar. Mendukung *Mint, Transfer, Burn* secara massal (*batch*).
3. **Premium Item Contract (ERC-721)**: Untuk kosmetik *Legendary* atau *Avatar* 1/1.
4. **SBT Contract (ERC-5192 / Modifikasi ERC-721)**: Memverifikasi *Signature EIP-712* dari server untuk *minting achievement*.
5. **Treasury Contract**: Menyimpan pendapatan dari penjualan, memiliki fungsi pembagian *revenue* (*Splitter*).

## 12. Database Planning (Relational Schema)
Menggunakan **PostgreSQL** untuk konsistensi tingkat tinggi.
* `Users`
  - `id` (UUID, PK), `wallet_address` (String, Unique), `username` (String), `elo_rating` (Int), `soft_currency` (Int), `xp` (Int), `created_at` (Timestamp).
* `Matches`
  - `id` (UUID, PK), `p1_id` (UUID, FK), `p2_id` (UUID, FK - *Ghost*), `p1_score` (Int), `p2_score` (Int), `p1_loadout` (JSON), `p2_loadout` (JSON), `status` (Enum: completed, forfeited), `created_at` (Timestamp).
* `Inventory`
  - `id` (UUID, PK), `user_id` (UUID, FK), `item_sku` (String), `is_nft` (Boolean), `token_id` (String, nullable), `quantity` (Int), `is_equipped` (Boolean), `created_at` (Timestamp).
* `Transactions` (Log off-chain)
  - `id` (UUID, PK), `user_id` (UUID, FK), `item_sku` (String), `price` (Decimal), `currency` (Enum: offchain, crypto), `tx_hash` (String, nullable).
* `Achievements`
  - `id` (UUID, PK), `user_id` (UUID, FK), `achievement_type` (String), `sbt_token_id` (String, nullable), `minted_at` (Timestamp).
* `Season_Pass`
  - `user_id` (UUID, FK), `season_id` (Int), `current_level` (Int), `pass_type` (Enum: free, premium).

## 13. Security Planning
1. **Cheating & Fisika**: Klien mengirim *input* (vektor tarikan). Server mereplikasi simulasi lintasan proyektil dan tabrakan. Klien murni bersifat visual.
2. **Replay Attack**: SBT Claim diamankan dengan EIP-712 *Nonce* satu kali pakai.
3. **Race Condition**: Pengurangan saldo/pembelian inventory di PostgreSQL dilindungi dengan kunci baris (*Row-level Locking* `FOR UPDATE`).
4. **Blockchain Event Tampering**: Backend akan membaca RPC dengan *block confirmations* (misal menunggu 2 blok final) sebelum mensinkronisasi kepemilikan NFT ke tabel `Inventory`.

## 14. Backend Architecture
* **Stack Utama**: Node.js (TypeScript) dengan NestJS atau Express.
* **Game/Simulation Server**: Modul independen berisi algoritma fisika 2D/3D *headless* untuk validasi hasil panahan (*Server-Authoritative*).
* **Web3 Indexer**: *Worker process* yang polling RPC untuk event kontrak dan mengemasnya ke database.
* **Caching**: Redis untuk *Matchmaking Queue*, *Leaderboard* (Sorted Sets), dan *Session Data*.

## 15. Frontend Architecture & Asset Pipeline
* **Web Framework**: React atau Next.js untuk UI (DOM) dan integrasi *Wallet* (menggunakan `viem` & `wagmi`).
* **Game Engine**: Canvas dengan Three.js (jika 3D) atau Phaser 3 (jika 2D), yang berkomunikasi dua arah dengan React melalui Zustand/Redux.
* **Asset Pipeline (Optimasi Aset)**:
  1. *Creation*: Aset 3D dibuat di Blender.
  2. *Compression*: Diekspor ke format `.glb` / `.gltf`. Geometri dikompres menggunakan Draco (`DRACOLoader`), dan tekstur dikompres ke KTX2/Basis Universal untuk menghemat VRAM.
  3. *Delivery*: File *bundling* dan aset game diletakkan di S3 Bucket dan disajikan melalui Global CDN (Cloudflare/AWS CloudFront).
  4. *Loading*: Menggunakan *Asset Manifest* dan *Preload Manager* saat layar loading, didukung oleh *Service Worker* agar unduhan disimpan di cache browser lokal secara persisten, menghindari unduh ulang.

## 16. Risks
1. **Web3 Friction**: *Gas fees* dan keharusan memiliki kripto dapat membatasi pasar. (Mitigasi: Paymaster/Account Abstraction).
2. **Botting**: Bot memainkan *ghost replay*. (Mitigasi: Validasi kurva tarikan *input* yang tidak wajar).
3. **RPC Failure**: Layanan node *down*. (Mitigasi: Fallback provider RPC).

## 17. Future Expansion
* Real-time Multiplayer & Turnamen Live.
* Guild System (Dojo) & GvG (Guild vs Guild).
* Integrasi *Tokenomics* lanjutan (Dual-Token System) jika model kosmetik mulai stabil.

## 18. MVP Scope
1. Login Wallet.
2. Mode Practice & PvP Ghost Replay.
3. Leaderboard berbasis ELO.
4. Smart Contract SBT Achievement (1-2 pencapaian dasar).
5. Basic Shop (pembelian item dengan Soft Currency).
6. Profile, History, dan Core Loop yang stabil.

## 19. Post-MVP Roadmap
* **Phase 2**: Peluncuran NFT Shop, Season Pass Musim Pertama, Asset Pipeline Web3 penuh.
* **Phase 3**: League System, Crafting / Item Merging.
* **Phase 4**: Fitur pertemanan, Private Match, dan Analytics lanjutan.
* **Phase 5**: Mobile Browser Optimization dan Account Abstraction (Email Login).
