# System Architecture & Technical Blueprint: GameFi Archery Web3

---

## 1. High Level Architecture

Arsitektur ini dirancang menggunakan pendekatan modular yang memisahkan antara Presentation (Client), API (Backend), Storage (Database), dan Layer Konsensus (Blockchain).

```text
               +-------------------------------------------------+
               |                   BROWSER                       |
               |                                                 |
               |  +-------------+               +-------------+  |
               |  |  React UI   | <-----------> | Game Engine |  |
               |  | (Frontend)  |               |  (WebGL)    |  |
               |  +-------------+               +-------------+  |
               |         |                             |         |
               +---------|-----------------------------|---------+
                         |                             |
      (HTTPS/WSS)        |                             | (HTTPS - Post Match)
                         v                             v
               +-------------------------------------------------+
               |                   API GATEWAY                   |
               +-------------------------------------------------+
                         |                             |
          +--------------+--------------+              | (Web3 JSON-RPC)
          |                             |              v
+-------------------+         +-------------------+  +---------------+
|   CORE BACKEND    |         |   WEB3 INDEXER    |  |  BLOCKCHAIN   |
|  (Microservices)  | <-----> |     WORKER        |  |  (RPC Node)   |
+-------------------+         +-------------------+  +---------------+
          |                             |                    ^
          +------------+----------------+                    | (Read/Write)
                       |                                     |
               +-------+-------+                     +-------+-------+
               |               |                     |               |
       +---------------+ +-----------+       +---------------+ +---------------+
       | PostgreSQL DB | |   Redis   |       | Shop Contract | | SBT Contract  |
       +---------------+ +-----------+       +---------------+ +---------------+

+-------------------+   +---------------+
|        CDN        |   |   ANALYTICS   |
| (Assets/Static)   |   | (Data Engine) |
+-------------------+   +---------------+
```

**Tanggung Jawab Komponen**:
*   **Browser**: Environment berjalannya aplikasi klien.
*   **Frontend (React)**: Menangani antarmuka UI (DOM), Web3 *wallet connection*, dan manajemen *state* aplikasi.
*   **Game Engine (WebGL)**: Menangani kalkulasi fisika (visual), *rendering* grafik panahan 2D/3D, input pemain, dan siklus *frame*.
*   **API Gateway**: *Reverse proxy* untuk keamanan (Rate Limiting, CORS) dan rute (*routing*) request ke *backend services*.
*   **Core Backend**: Berisi *business logic*, API profil, *matchmaking*, validasi skor *server-authoritative*, dan pengelolaan *leaderboard*.
*   **Web3 Indexer Worker**: *Background service* yang secara terus-menerus memantau *event* dari blockchain (misal: pembelian, *minting*) dan menyinkronkannya ke *database* lokal.
*   **Database (PostgreSQL)**: *Single source of truth* untuk data *off-chain* (profil, riwayat laga, *inventory* dasar).
*   **Redis Cache**: Menyimpan sesi, antrean *matchmaking*, dan klasemen sementara secara *in-memory* demi performa tingkat tinggi.
*   **Blockchain RPC**: Gerbang komunikasi antara backend/frontend ke jaringan *blockchain* (L1/L2).
*   **Smart Contracts**: Logika yang dieksekusi secara desentralisasi untuk mengatur hak milik aset (NFT), pencapaian (SBT), dan ekonomi *shop*.
*   **CDN**: Menyimpan dan mendistribusikan aset statis (model 3D, suara, gambar) di lokasi tepi (*edge*) global.
*   **Analytics**: Data *warehouse* terpisah untuk menganalisis perilaku pemain.

---

## 2. Complete System Flow

Siklus bermain *end-to-end* yang mendefinisikan *loop* kehidupan pemain.

```text
[Player Buka Website] 
         |
         v
[Connect Wallet (MetaMask/WalletConnect)]
         |
         v
[Authentication (Sign Message & Verify)]
         |
         v
[Load Profile & Inventory dari DB]
         |
         v
[Pilih Mode: Gameplay PvP]
         |
         v
[Game Engine Fetch Ghost Replay Data]
         |
         v
[Main Game (Shoot Arrows)]
         |
         v
[Kirim Vektor Input ke Backend (Score Validation)]
         |
         v
[Backend Verifikasi Fisika & Kalkulasi Skor]
         |
         v
[Simpan ke Database (Match History & Replay)]
         |
         v
[Update Redis Leaderboard (ELO Rating)]
         |
         v
[Achievement Check (Apakah memenuhi syarat SBT?)]
         |
         v
[Claim SBT (Jika memenuhi syarat -> Sign Payload)]
         |
         v
[Akses Shop]
         |
         v
[Beli Kosmetik (Transaksi Blockchain)]
         |
         v
[Indexer Sinkronisasi ke DB Inventory]
         |
         v
[Pemain Update Equipment]
         |
         v
[Play Again]
```

---

## 3. Trust Boundary

Keamanan sistem berbasis pada asumsi lingkungan mana yang aman dan mana yang tidak.

*   **Komponen yang TIDAK Dipercaya (Untrusted)**:
    *   **Client (Browser)**: Berjalan di mesin pengguna dan bisa dimodifikasi menggunakan alat *debugging* jaringan.
    *   **Frontend**: UI dapat dimanipulasi; kode JS dapat direkayasa balik (*reverse engineered*).
    *   **Game Engine**: Koordinat, *hitbox*, dan skor yang diklaim oleh *engine* bisa dipalsukan (memori diubah menggunakan alat *cheat*).
    *   **Wallet**: Meskipun kunci privat aman, klien dapat memodifikasi isi *payload* transaksi sebelum ditandatangani.

*   **Komponen yang DIPERCAYA (Trusted)**:
    *   **Backend & Game Server (Physics Validator)**: Menerima *input* dari klien, menjalankan simulasi fisika sendiri, lalu menentukan hasil sebenarnya. Ini kebenaran absolut untuk sistem.
    *   **Database**: Terisolasi di jaringan privat AWS/Cloud, hanya backend yang dapat menulis ke tabel ini.
    *   **Blockchain & Smart Contracts**: Terdesentralisasi, tahan *tamper* (immutable). Kode publik, eksekusi terverifikasi konsensus.
    *   **Indexer**: Logika internal backend yang mengekstrak kepastian dari blok *chain*.
    *   **RPC**: Penyedia *node* kelas *enterprise* (Alchemy/Infura) yang dipasang dengan autentikasi.

*   **Alasan Utama (Don't Trust The Client)**: Pemain memiliki insentif moneter (mendapat peringkat/kripto) untuk memalsukan skor. Semua kalkulasi kemenangan, pembagian *reward*, dan kelayakan SBT harus diverifikasi ganda oleh Backend.

---

## 4. Frontend Architecture

Arsitektur aplikasi klien dibagi berdasarkan tanggung jawab untuk menjaga kode tetap *maintainable*.

*   **Game Layer**: Berisi instansiasi WebGL (*engine* khusus seperti Phaser atau Three.js). Tanggung jawab utamanya hanyalah rendering dan penerimaan *input* layar/mouse. Terisolasi penuh dari UI React.
*   **UI Layer**: React/Next.js bertugas menangani tampilan DOM (HTML/CSS) di luar layar permainan. *Overlay*, *modal*, *dashboard*.
*   **Wallet Layer**: Wrapper menggunakan `wagmi` / `viem` untuk menghubungkan aplikasi ke ekosistem Web3, menangani pergantian jaringan, dan *error handling* dari dompet pengguna.
*   **API Layer**: Modul tunggal untuk berkomunikasi (Axios/Fetch) dengan backend, menangani token JWT, dan pemulihan koneksi.
*   **State Management**: Zustand atau Redux Toolkit. Menangani *state* global (*User Profile*, *Current Route*, *Audio Volume*).
*   **Asset Loader**: Modul *preloader* untuk mengunduh model GLTF, tekstur, dan audio dari CDN, dengan kapabilitas menyimpan ke *Service Worker Cache* peramban.
*   **Profile Module**: Menampilkan statistik, *equipped items*, dan riwayat laga.
*   **Shop Module**: Katalog etalase, membedakan UI mata uang (crypto vs off-chain point).
*   **Leaderboard Module**: Komponen paginasi untuk merender tabel peringkat.
*   **Inventory Module**: Galeri item yang dimiliki, logika UI untuk *equip/unequip*.
*   **Analytics Module**: Pelacak interaksi (Pixel/Mixpanel) yang merekam setiap klik tombol dan layar yang dikunjungi untuk metrik UX.
*   **Authentication Module**: Meminta *wallet signature* saat koneksi awal dan menyimpan JWT.
*   **Notification Module**: *Toast/Snackbar* global (contoh: "Item successfully minted!").
*   **Settings Module**: Pengaturan UI (bahasa, kualitas grafis).

**Dependency Flow**: Game Layer bergantung pada Asset Loader dan membaca Equipment dari State Management. UI Layer dan Game Layer berkomunikasi via *Custom Events* (Event Bus), tidak saling mengubah *state* secara langsung.

---

## 5. Backend Architecture

Backend menggunakan pola *Modular Monolith* (yang disiapkan agar mudah dipecah menjadi *Microservices* di masa depan).

*   **Authentication Service**: Menerbitkan dan memvalidasi JWT. Memverifikasi tanda tangan kriptografi (EIP-4361: Sign-In with Ethereum).
*   **User Service**: Membuat (onboarding) profil pengguna baru, menyimpan tingkat XP.
*   **Inventory & Equipment Service**: Mengelola apa yang dimiliki pemain (off-chain), memvalidasi ketersediaan saat pemain melakukan *equip*.
*   **Gameplay (Physics Validation) Service**: *Headless simulator* (berjalan di Node.js/Go tanpa antarmuka). Menerima koordinat arah tarikan panah, lalu menyimulasikan hasil proyektil, sehingga skor 100% aman.
*   **Ghost Replay Service**: Merekam JSON rentetan input (vektor, waktu) dari pemain yang menyelesaikan pertandingan, lalu menyediakannya saat pemain lain meminta *matchmaking*.
*   **Leaderboard Service**: Membaca ELO dari DB, memasukkannya ke Redis Sorted Set. Menyediakan daftar klasemen dengan latensi kurang dari 10ms.
*   **Match History Service**: Mencatat log setiap akhir ronde untuk transparansi analitik.
*   **Analytics Service**: Mengagregasi metrik performa (*Average Score*, *Win Rate*).
*   **Achievement Service**: Memantau statistik. Bila memenuhi syarat, menghasilkan EIP-712 *signature* dan menyimpannya ke antrean *claim*.
*   **Shop Service**: Memvalidasi transaksi NFT dari Blockchain dan mengurangi mata uang *off-chain* jika itu item biasa.
*   **Indexer Service**: *Daemon* yang secara proaktif menelusuri *event log* dari *Smart Contract* untuk menjembatani *on-chain* dan *off-chain*.
*   **Admin Service**: Backoffice khusus developer (banned user, ganti season).

**Hubungan**: API Gateway $\rightarrow$ Gameplay Service $\rightarrow$ *memanggil* Match History $\rightarrow$ *memanggil* Leaderboard $\rightarrow$ *memanggil* Achievement Service (Pola berantai/Pub-Sub internal).

---

## 6. Game Engine Architecture

Komponen internal mesin fisika (disarankan menggunakan arsitektur ECS - Entity Component System).

*   **Input Manager**: Mengambil *mouse/touch event* (menarik panah, mengatur sudut, melepaskan).
*   **Aim System**: Menggambar lintasan panah visual (Trajektori UI).
*   **Arrow Physics**: Memberikan *velocity* (kecepatan awal) dan menjatuhkan *gravity* (parabola) pada setiap *tick* *engine*.
*   **Wind System**: Komponen lingkungan yang menambahkan gaya dorong lateral (*offset*) pada panah.
*   **Collision System**: Mendeteksi tabrakan (AABB / Sphere Cast) antara proyektil panah dengan objek Target.
*   **Target Manager**: Mengontrol pergerakan target sasaran statis/dinamis, memecah target menjadi area-area skor (Bullseye = 10, Pinggir = 5).
*   **Score Manager**: Menghitung poin tiap ronde.
*   **Round Manager**: *State machine* yang mengontrol urutan ronde (Ronde 1, Ronde 2... Hasil).
*   **Timer System**: Memberikan batasan waktu bidikan (jika melebihi, skor 0).
*   **HUD (Heads-Up Display)**: UI layar permainan internal (Indikator Angin, Sisa Waktu, Skor Saat Ini).
*   **Result Screen**: Layar transisi setelah *gameplay* berakhir, sebelum dilempar kembali ke React UI.
*   **Replay Recorder**: Mencatat setiap *input event* per milidetik ke dalam memori.
*   **Replay Player (Ghost)**: Mengeksekusi ulang log JSON seolah-olah pemain hantu sedang bermain.
*   **Asset Loading / Scene Management**: Mengelola alokasi VRAM (menghapus memori tekstur saat kembali ke lobi utama).
*   **Game State**: Pola Singleton yang mengelola konteks pertandingan saat ini.

---

## 7. Blockchain Architecture

Peta *Smart Contract* dan pola relasi:

```text
[Role Manager] <---+ (Manajemen Akses)
                   |
[Shop Contract] ---+---> [ERC1155 Item] (Konsumabel/Efek)
                   |
                   +---> [ERC721 NFT] (Bow/Avatar Unik)
                   |
[Treasury] <-------+ (Menampung Dana Transaksi)

[Backend API] ---> [SBT Contract (ERC5192)] (Mint pencapaian dengan EIP-712)
```

**Lifecycle Transaksi (Shop)**:
Pemain memanggil fungsi `buyItem(SKU, jumlah)` $\rightarrow$ Shop Contract verifikasi stok dan harga $\rightarrow$ Shop Contract memotong saldo ETH/ERC20 pengguna $\rightarrow$ Transfer dana ke Treasury $\rightarrow$ Memanggil `mint` pada ERC1155/721 untuk pengguna.

---

## 8. Inventory Architecture

Koreografi antara kepemilikan mutlak di *chain* dan *game state*.

1.  **Purchase**: Pemain menandatangani transaksi lewat *wallet*.
2.  **Blockchain Event**: Transaksi sukses, kontrak menembakkan `ItemMinted(wallet, itemId)`.
3.  **Indexer**: *Worker backend* melihat blok tersebut melalui RPC.
4.  **Backend**: Memproses event dan menuliskannya ke tabel `Inventory`.
5.  **Database**: Menambahkan stok/membuat entri item untuk pengguna.
6.  **Frontend**: UI React secara asinkron men-*polling* atau menerima status *websocket*, memberikan tahu "Item telah masuk!".
7.  **Equipment**: Pemain memilih 'Equip' di profil. Database mencatatnya.
8.  **Gameplay**: Game engine *render* aset ini saat pemain masuk pertandingan.

---

## 9. Equipment System

Desain sistem *equipment* menggunakan *Identifier String/SKU*.

*   **Slot Equipment**:
    *   `bow` (Tampilan utama busur)
    *   `arrow_skin` (Bentuk dan warna anak panah)
    *   `trail_effect` (Efek partikel buntut panah, *off-chain only*)
    *   `hit_effect` (Efek ledakan/partikel saat panah menancap)
    *   `avatar` (Foto pemain, NFT PFP)
    *   `banner` (Latar belakang profil)
    *   `emote` (Dapat dimunculkan saat menembak tepat sasaran).

*   **Game Engine Pipeline**: 
    Sesaat sebelum `Scene` termuat, *engine* meminta `/api/user/loadout`. API membalas `{"bow": "LEGENDARY_FIRE_BOW"}`. *Engine* mencari di manifes *asset loader* URL untuk model `LEGENDARY_FIRE_BOW.glb` dan merendernya.

---

## 10. Gameplay Lifecycle

Alur kejadian dari sudut pandang state internal saat pemain masuk pertandingan.

1.  **Masuk Match**: Klien menekan `Play PvP`.
2.  **Download Ghost**: Backend mengambil ID pemain, menyesuaikan ELO, dan mengirimkan URL JSON berisi gerak-gerik lawan hantu.
3.  **Load Assets**: Engine membongkar model karakter pemain dan model hantu.
4.  **Gameplay**: Layar interaktif, 5 ronde tarikan panah secara bergiliran/paralel dengan animasi hantu.
5.  **Validation**: Array dari sudut tarikan (*angle*), tarikan maksimal (*power*), dan waktu (*timestamp*) dilempar ke backend via HTTP POST.
6.  **Scoring**: Backend menyimulasikan kelima tembakan tersebut dan membalas dengan total skor sebenarnya.
7.  **Save Replay**: Jika skor valid, array tadi disimpan ke tabel `Ghost_Replays`.
8.  **Leaderboard**: Mengalkulasi sistem *Rating ELO*, poin naik/turun di- *update*.
9.  **Achievement Check**: Layanan memindai apakah pemain mencetak *win streak* baru.
10. **Reward**: Memberikan XP *Season Pass* dan *Soft Currency*.
11. **Return Dashboard**: Engine dinonaktifkan, UI React kembali memegang kendali.

---

## 11. Shop Architecture

Alur sinkronisasi hibrid (Web3 & Web2).

1.  **Open Shop**: Frontend memanggil API `/api/shop/catalog` untuk etalase barang, harga, dan sisa *supply* (dibaca dari *cache* backend yang tersinkronisasi).
2.  **Purchase**: Pemain klik beli untuk Item NFT. Wallet (MetaMask) *pop-up*.
3.  **Blockchain**: Pengguna menyetujui transaksi (gas + harga). Transaksi ter- *mine*.
4.  **Indexer**: Mengonfirmasi *receipt* status = 1.
5.  **Inventory**: Tabel SQL diperbarui.
6.  **Frontend Refresh**: Klien memanggil `/api/user/inventory` dan UI langsung memunculkan kartu item (Unboxing).

---

## 12. Achievement Architecture

Siklus hidup Soulbound Token berbasis validasi.

1.  **Condition Met**: Selama *Gameplay Lifecycle*, layanan mendeteksi "10 Win Streak".
2.  **Backend Verification**: API menyimpan status pencapaian dan mengamankan status (terkunci).
3.  **Signature**: Backend men-*generate* payload: `hash(Wallet + AchievementID + Nonce)`. Lalu menandatanganinya dengan *Private Key Server*.
4.  **Claim**: Klien menekan "Claim SBT" dan memanggil `mintSBT(Wallet, AchievementID, Nonce, Signature)` di kontrak pintar.
5.  **Mint**: *Smart contract* mengeksekusi `ecrecover` untuk memvalidasi *Signer* = *Server Backend*. Jika benar, SBT dicetak on-chain.
6.  **Indexer**: Mendeteksi mint.
7.  **Profile**: Profil publik pengguna kini memiliki lambang lencana permanen dari *chain*.

---

## 13. Event Driven Architecture

Agar *service* backend tetap tidak terikat rapat (*decoupled*).

| Nama Event | Publisher (Penerbit) | Subscriber (Penerima) |
| :--- | :--- | :--- |
| `UserRegistered` | Auth Service | Profile Service, Analytics Service |
| `MatchFinished` | Gameplay Service | Leaderboard Service, Match History, Achievement, Replay Service |
| `LeaderboardUpdated` | Leaderboard Service | Notification Service |
| `ItemPurchased` | Web3 Indexer | Inventory Service, Analytics |
| `ItemEquipped` | Inventory Service | Profile Service |
| `AchievementUnlocked` | Achievement Service | Notification Service (Toast) |
| `SBTClaimed` | Web3 Indexer | Profile Service, Analytics |
| `SeasonEnded` | Admin Service (Cron) | Leaderboard (Reset), Inventory (Reward) |

---

## 14. API Communication

Semua komponen dirangkai menggunakan jalur ini:

*   **Frontend ↔ Backend**: REST API (menggunakan JSON + Bearer Token JWT) untuk kemudahan integrasi dengan React.
*   **Backend ↔ Database**: TCP (menggunakan *Connection Pooling* via ORM Prisma/TypeORM) untuk mencegah *overhead* koneksi saat konkurensi tinggi.
*   **Backend ↔ Redis**: TCP Langsung (menggunakan ioredis).
*   **Backend ↔ Blockchain**: HTTP/WebSocket JSON-RPC (via provider seperti Alchemy/Infura). WebSocket digunakan pada indexer untuk memantau blok *real-time*.
*   **Backend ↔ Indexer**: Message Broker (RabbitMQ atau Redis Pub/Sub) agar backend lain mengetahui status rantai tanpa mengunci proses.
*   **Wallet ↔ Smart Contract**: HTTP RPC via eksistensi peramban (MetaMask injected `window.ethereum`).

**Sequence Diagram (Siklus Match):**

```text
Client (Browser)        Backend API        Game Server       Database/Redis
       |                     |                  |                  |
       |--- 1. POST Match -->|                  |                  |
       |  (Input Array JSON) |                  |                  |
       |                     |--- 2. Validate ->|                  |
       |                     |     Physics      |                  |
       |                     |<-- 3. Results ---|                  |
       |                     |   (Score: 250)   |                  |
       |                     |                  |-- 4. Update ELO->|
       |                     |                  |-- 5. Save Hist ->|
       |<-- 6. Response -----|                  |                  |
       |   (Final Score)     |                  |                  |
```

---

## 15. Folder Structure

Struktur *monorepo* standar industri untuk produk kompleks.

```text
/gamefi-archery-dapp
 ├── docs/             # Berkas dokumentasi, PRD, Arsitektur Blueprint
 ├── frontend/         # Klien aplikasi (Next.js/React + UI Components)
 ├── game-engine/      # Modul WebGL (Phaser/Three.js) diisolasi untuk build khusus
 ├── backend/          # NestJS atau Express API Server
 ├── contracts/        # Proyek Foundry/Hardhat berisi file Solidity (.sol)
 ├── indexer/          # Worker service (Go/Node.js) pembaca blockchain
 ├── shared/           # Tipe antarmuka TypeScript (.d.ts) berbagi (Backend & Frontend)
 ├── scripts/          # Skrip setup lokal, seeder DB, migration
 ├── docker/           # Berkas Dockerfile & docker-compose.yml
 ├── infrastructure/   # Terraform/Pulumi (IaC) untuk AWS/GCP
 ├── deployment/       # Skrip CI/CD (GitHub Actions)
 └── assets/           # File mentah model 3D, tekstur, audio (.blend, .wav)
```

---

## 16. Deployment Architecture

Menggunakan infrastruktur *Cloud Native* (AWS/GCP).

*   **Development**: *Docker Compose* murni untuk simulasi keseluruhan di mesin developer lokal (DB lokal, Redis lokal, Hardhat Local Node).
*   **Staging**: Satu kluster *Kubernetes* skala kecil dengan basis data awan ringan. Tempat uji coba QA dan tes penetrasi.
*   **Production**:
    *   **CDN (Cloudflare)**: Menghadapi klien, me- *cache* berkas *game engine* dan *asset*, menyediakan proteksi DDoS berlapis ganda.
    *   **Reverse Proxy / Ingress**: Nginx Load Balancer untuk rute lalu lintas API masuk.
    *   **Container**: *Backend* dijalankan menggunakan Kubernetes (EKS) untuk kemampuan *scaling* otomatis (*Horizontal Pod Autoscaler*).
    *   **Database**: Amazon Aurora PostgreSQL (Primary-Replica).
    *   **RPC Node**: Node langganan kelas *Enterprise* ganda (Infura sebagai utama, Alchemy sebagai cadangan/fallback).
    *   **Monitoring**: Prometheus untuk menarik metrik *Pod*, Grafana untuk dasbor visual.
    *   **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana) atau Datadog untuk mencari pesan kesalahan lintas *microservice*.
    *   **Secrets**: AWS Secrets Manager mengelola *private key* untuk EIP-712 *signer* (agar tidak berada di dalam kode).

---

## 17. Scalability Strategy

Evolusi arsitektur seiring bertambahnya populasi pemain.

| Skala (Pemain) | Strategi Eskalasi & Infrastruktur |
| :--- | :--- |
| **1.000 (MVP)** | *Single Monolith Instance* (Node.js/Go) di DigitalOcean/EC2 kecil. DB PostgreSQL tunggal. Cache in-memory. Indexer menyatu dengan backend. Blockchain menggunakan RPC *free tier*. |
| **10.000** | Memisahkan server Frontend statis ke CDN penuh. Mengaktifkan 2 kontainer Backend dengan Load Balancer. Redis mulai dihidupkan sebagai *standalone instance*. Membeli tier RPC kelas menengah (batas 10 juta panggilan/bulan). |
| **100.000** | Backend diubah ke Kubernetes dengan 5-10 Pod *auto-scaling*. Tabel `Ghost_Replays` (sangat masif) mulai dipindahkan ke penyimpanan *NoSQL* (MongoDB) atau S3 (disimpan sebagai `.json` statis). PostgreSQL dikhususkan dengan arsitektur 1-Master 2-Read Replicas. Worker Indexer dipisah menjadi proses independen mutlak. |
| **1.000.000** | Transisi ke *Microservices* murni. Layanan *Match History* dipisah dan menggunakan strategi *Database Sharding*. Komunikasi antar layanan diubah ke *Message Queue* (Kafka) agar server tidak saling menahan koneksi HTTP. Membangun *Game Server Authoritative* kustom (menggunakan C++ atau Go). Penggunaan RPC kelas atas (Dedicated Node) dan optimalisasi biaya blockchain menggunakan arsitektur L2 (Layer 2 / Rollup / AppChain khusus). |

---

## 18. Decision Matrix

*Keputusan teknis krusial dan alasannya.*

### A. Format Matchmaking & Gameplay PvP
*   **Alternatif**: 1) Real-time Sync, 2) Ghost Replay (Asynchronous Real-time feel).
*   **Kelebihan Real-time**: Paling adil, interaktif instan.
*   **Kekurangan Real-time**: Membutuhkan CCU sangat besar, rentan terhadap lag jaringan peramban, server *websocket* sangat mahal.
*   **Keputusan**: **Ghost Replay**. Pengalaman di mata pemain sama tegansnya seperti Real-time (animasi hantu musuh dimainkan berbarengan), namun *bandwidth* dan infrastruktur server 100x lebih murah dan stabil.

### B. Validasi Kalkulasi Fisika (Anti-Cheat)
*   **Alternatif**: 1) Server Menerima Skor Langsung, 2) Server Menerima Input & Menyimulasikan Ulang.
*   **Kelebihan Opsi 1**: Beban server sangat ringan, koding mudah.
*   **Kekurangan Opsi 1**: Skrip *Cheat Engine* atau eksploitasi API akan dengan cepat menghancurkan ekonomi *game* dan integritas *leaderboard*.
*   **Keputusan**: **Opsi 2 (Server-Authoritative)**. Server menjalankan *physics engine headless* di memori RAM dan mengonfirmasi bahwa skor dari input tersebut benar-benar masuk akal. Ini satu-satunya cara bertahan dari pemain nakal.

### C. Penyimpanan Riwayat Rekaman (Replay Log)
*   **Alternatif**: 1) PostgreSQL (Kolom tipe JSONB), 2) Object Storage (Amazon S3 / R2).
*   **Kelebihan PostgreSQL**: Mudah di- *query* dan ditangani oleh ORM.
*   **Kekurangan PostgreSQL**: Seiring bertambahnya pertandingan (bisa jutaan per hari), database akan "meledak" kapasitas penyimpanannya, berakibat penurunan kecepatan pencarian drastis.
*   **Keputusan**: Untuk fase MVP, gunakan **PostgreSQL JSONB**. Untuk fase komersial (skala 100k pemain), migrasi sistem untuk membundel log JSON ke dalam **AWS S3** dan menyimpan URL-nya di tabel `Matches` relasional.

### D. Metode Distribusi Achievement On-chain
*   **Alternatif**: 1) Server memanggil *Mint* langsung (bayar gas untuk pemain), 2) Server menerbitkan *Signature* (Pemain memanggil *Mint* sendiri).
*   **Kelebihan Opsi 1**: Pengalaman pengguna (UX) terbaik, tiada friksi.
*   **Kekurangan Opsi 1**: Membuka celah eksploitasi di mana *wallet server* akan dikuras gas-nya (*Sybil / bot gas draining attack*).
*   **Keputusan**: **Opsi 2 (EIP-712 Signature)**. Mengalihkan tanggung jawab pembayaran gas (Gas Fee) ke pengguna. Jika ingin gratis, implementasikan pola ERC-4337 (Account Abstraction) di masa depan agar bisa diatur kontrol ketat lewat *Paymaster*.

### E. Final Technical Stack
Berdasarkan pertimbangan skalabilitas, ekosistem web3, dan efisiensi MVP:
*   **Frontend**: Next.js (React) + Zustand (State Management).
*   **Game Engine**: Phaser 3 (Mendukung MVP Archery 2D kasual dengan physics ringan dan kompatibilitas DOM terbaik).
*   **Backend**: NestJS (TypeScript) (Memastikan tipe data konsisten di seluruh monorepo).
*   **Database**: PostgreSQL (Supabase/Neon untuk cloud-native MVP).
*   **Cache & Queue**: Redis.
*   **Web3 Integration**: viem + wagmi.
*   **RPC Provider**: Alchemy (Primary) + Infura (Fallback).
*   **Smart Contract**: Foundry (Solidity).
