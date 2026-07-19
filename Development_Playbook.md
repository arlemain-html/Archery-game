# Development Playbook, Monorepo Architecture & Implementation Roadmap

## 1. Development Philosophy

Proyek GameFi Archery dikembangkan dengan menjunjung tinggi filosofi **"Modular, Predictable, & AI-First Execution"**.

* **Modular Development**: Setiap batas domain (Frontend, Backend, Game Engine, Blockchain) dipisahkan secara ketat (loosely coupled) namun dapat dikelola secara terpusat (tightly integrated dev-experience) menggunakan monorepo.
* **Feature Driven Development (FDD)**: Pengembangan berorientasi pada fitur yang memberikan nilai bisnis langsung, bukan sekadar membangun lapisan infrastruktur yang belum terpakai.
* **Incremental Delivery & Vertical Slice**: Setiap Sprint harus menghasilkan satu potongan vertikal (dari Database $\rightarrow$ API $\rightarrow$ Frontend) yang bisa dijalankan dan diuji.
* **MVP First**: Fitur utama yang mendorong retensi dan transaksi (Core Gameplay, Ghost PvP, Basic Shop, Wallet Login) diutamakan. Sistem sekunder (Analytics rumit, Guild) ditunda.
* **Continuous Integration**: Kode harus selalu bisa dikompilasi (buildable) di cabang utama.
* **Continuous Refactoring**: Hutang teknis dibayar bertahap di dalam pengerjaan fitur, menjaga agar kode tetap bersih seiring skala proyek.

---

## 2. Monorepo Architecture

Struktur Monorepo (misalnya menggunakan Turborepo / Yarn Workspaces / pnpm workspaces) digunakan untuk menyatukan seluruh siklus pengembangan dalam satu repositori.

```text
archery-dapp/
├── apps/
│   ├── web/                (Next.js App Router - Frontend)
│   ├── api/                (NestJS - Backend Server)
│   └── game-server/        (Node.js Headless - Deterministic Physics Validator)
├── packages/
│   ├── contracts/          (Hardhat/Foundry - Solidity Smart Contracts)
│   ├── game-engine/        (Three.js - Core Gameplay Logic & Rendering)
│   ├── ui/                 (Shared React Components & Tailwind Config)
│   ├── config/             (Shared ESLint, Prettier, TSConfig)
│   ├── types/              (Shared TypeScript Interfaces, DTOs, Enums)
│   └── blockchain-sdk/     (Abstraksi Viem/Wagmi & Contract ABI)
├── docker/                 (Dockerfiles & docker-compose.yml)
├── docs/                   (SDS, PRD, Blueprint, Architecture)
├── scripts/                (Automation scripts, CI helpers, DB Migrations)
├── .github/                (GitHub Actions CI/CD workflows)
├── package.json
└── turbo.json              (Build pipeline orchestrator)
```

**Fungsi Direktori:**
* `apps/`: Berisi aplikasi akhir yang dapat dideploy secara independen (Web, API).
* `packages/`: Modul-modul perpustakaan internal yang dikonsumsi oleh `apps/`.
* `packages/game-engine`: Engine 3D dipisahkan agar dapat diuji secara independen tanpa Next.js, dan membagikan logika deterministiknya ke `apps/game-server`.

---

## 3. Dependency Graph

Diagram ketergantungan paket dirancang untuk mencegah **Circular Dependency**. Paket di atas mengonsumsi paket di bawahnya. Arah panah menunjukkan arah aliran impor (*imports*).

```mermaid
graph TD
    A[apps/web] --> B[packages/ui]
    A --> C[packages/game-engine]
    A --> D[packages/blockchain-sdk]
    A --> E[packages/types]
    
    F[apps/api] --> E
    F --> D
    
    G[apps/game-server] --> C
    G --> E
    
    B --> E
    B --> H[packages/config]
    C --> E
    C --> H
    D --> I[packages/contracts (ABIs)]
    D --> E
    D --> H
    
    I --> H
```

---

## 4. Package Responsibility

| Package | Purpose | Owner | Dependency | Public API / Output |
| :--- | :--- | :--- | :--- | :--- |
| **apps/web** | Aplikasi Frontend (React/Next.js) | Frontend Lead | `ui`, `game-engine`, `blockchain-sdk`, `types` | UI Web yang bisa diakses user, Route Next.js |
| **apps/api** | REST/GraphQL API Backend (NestJS) | Backend Lead | `types`, `blockchain-sdk` | Endpoint API, WebSocket Gateway |
| **apps/game-server**| Modul Headless validasi skor PvP | Backend Lead | `game-engine`, `types` | RPC Endpoint untuk validasi input fisik |
| **packages/contracts**| Smart Contract (Solidity) | Web3 Lead | `config` | *Deployed Bytecode*, ABI JSON, Typechain |
| **packages/game-engine**| Rendering 3D & Simulasi Fisik | Engine Lead | `types` | Kelas `GameEngine`, `GhostReplayer` |
| **packages/ui** | Komponen UI React (*Design System*) | Frontend Lead | `types` | Button, Modal, HUD Overlay (React Comp) |
| **packages/blockchain-sdk**| Abstraksi Ethers/Viem memanggil RPC | Web3 Lead | `contracts (ABI)`, `types` | Fungsi `mintSBT()`, `buyItem()`, `signLogin()` |
| **packages/types** | Definisi DTO & Interface lintas *stack* | System Arch. | Tidak ada | `IUserProfile`, `GhostData`, `MatchResult` |

---

## 5. Development Workflow

Alur kerja menggunakan variasi **Trunk-Based Development** yang dikombinasikan dengan siklus Peninjauan Singkat (Short-lived Feature Branches).

```mermaid
graph LR
    A[Issue Created] --> B[Planning & Assign]
    B --> C[Branch Creation]
    C --> D[Development (Local)]
    D --> E[Write Tests]
    E --> F[Commit & Push]
    F --> G[Open Pull Request]
    G --> H[CI Automated Checks]
    H --> I{Code Review}
    I -->|Changes Requested| D
    I -->|Approved| J[Merge to Main]
    J --> K[Deploy to Staging]
```

---

## 6. Branch Strategy

* **`main`**: Cabang utama yang *selalu stabil* dan mencerminkan versi terbaru untuk produksi / rilis selanjutnya. Melarang komit langsung (*Direct push disabled*).
* **`feature/<issue-number>-<short-desc>`**: (Contoh: `feature/TKT-102-wallet-login`). Cabang berumur pendek (maks 2 hari) untuk fitur baru.
* **`bugfix/<issue-number>-<short-desc>`**: (Contoh: `bugfix/TKT-204-fix-arrow-physics`). Untuk memperbaiki cacat pada fitur yang sudah di-merge tetapi belum rilis.
* **`hotfix/<issue-number>-<short-desc>`**: Untuk memperbaiki *bug* kritis (severity tinggi) yang bocor ke lingkungan *Production*. Di-branch dari tag rilis dan di-merge kembali ke rilis & `main`.
* **`chore/...`** atau **`refactor/...`**: Untuk pemeliharaan (update dependency, CI/CD).

---

## 7. Coding Standards

* **Folder Naming**: `kebab-case` (contoh: `components/match-history`).
* **File Naming**: 
  * TypeScript/React: `PascalCase.tsx` untuk komponen UI (contoh: `GameLayout.tsx`). 
  * Utility/Fungsi: `camelCase.ts` (contoh: `calculateScore.ts`).
  * Class/OOP: `PascalCase.ts` (contoh: `PhysicsEngine.ts`).
* **Variable/Function Naming**: `camelCase` (contoh: `isWalletConnected`, `getUserProfile()`).
* **Hook Naming**: Prefiks `use` dengan `camelCase` (contoh: `useMatchmaking`).
* **Event Naming**: `PascalCase` dengan subjek & kata kerja bentuk lampau (contoh: `ArrowReleased`, `MatchFinished`).
* **API Naming**: `kebab-case` untuk URI, RESTful (contoh: `GET /api/v1/users/:id/inventory`).
* **Database Naming**: `snake_case` (contoh: `user_id`, `created_at`).
* **Contract Naming**: `PascalCase` (contoh: `ArcheryShop.sol`, `AchievementSBT.sol`).
* **Type/Interface Naming**: `PascalCase`. (contoh: `type MatchResult`, `interface UserProfile`). Tidak perlu awalan 'I' klasik (bukan `IMatchResult`) kecuali terpaksa.
* **Enum Naming**: `PascalCase` untuk nama enum, `UPPER_SNAKE_CASE` untuk propertinya (contoh: `enum ItemRarity { COMMON, RARE }`).
* **Constant Naming**: `UPPER_SNAKE_CASE` (contoh: `MAX_MATCH_DURATION = 180`).
* **Commit Message**: Menggunakan **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).

---

## 8. Feature Development Order

Urutan implementasi dibangun dari fondasi (infrastruktur) menuju penyajian (Frontend).

1. **Environment & Monorepo Setup**: Inisialisasi Turborepo, CI/CD linting dasar.
2. **Types & Config**: Mendefinisikan DTO, Enum, dan interface utama (Kontrak API).
3. **Smart Contracts (Core)**: Token ERC1155, Kontrak SBT, Pengujian Hardhat.
4. **Database & Backend Core (Auth/SIWE)**: Skema Prisma/TypeORM, verifikasi dompet, JWT.
5. **Shared UI Kit & Blockchain SDK**: Wagmi/Viem *wrapper*, tombol-tombol dasar, koneksi dompet.
6. **Web Application Core**: Next.js *routing*, otentikasi login, profil pemain dasar.
7. **Game Engine (Offline Practice)**: Fisika, rendering busur, target, *hit detection*.
8. **Inventory & Equipment**: API sinkronisasi, *mesh swap* kosmetik di engine.
9. **Ghost Recording & Replay**: Menyimpan input *ghost*, mereplikasi di *engine*.
10. **PvP Matchmaking & Server Validation**: Antrean Redis, fungsi Headless validator skor.
11. **Shop & Web3 Integration**: Frontend berinteraksi dengan *Smart Contract* untuk membeli barang.
12. **Leaderboard & Analytics**: Sistem peringkat (ELO), antarmuka riwayat.
13. **Audio & VFX Polish**: Peningkatan *feel* permainan (*particle, sound*).

---

## 9. Sprint Planning (Contoh MVP 4 Sprints)

| Sprint | Goal | Deliverable | Dependency |
| :--- | :--- | :--- | :--- |
| **Sprint 1: Foundation** | Setup Repositori, Kontrak Dasar, Auth | Repositori aktif. Kontrak SBT di Testnet. Backend bisa SIWE login. Frontend bisa konek dompet. | Setup DevOps, RPC Node siap. |
| **Sprint 2: Game Core** | Gameplay mekanik tunggal berfungsi | Modul Game Engine (Three.js), mode *Practice*, integrasi HUD dasar ke React. | - |
| **Sprint 3: Multiplayer Asinkron** | Sistem Ghost PvP & ELO berjalan | Merekam input *ghost*, Backend *matchmaking*, pemutaran ulang di Frontend, Validasi skor. | Sprint 1 & 2 selesai. |
| **Sprint 4: Ekonomi & Poles** | Shop, Inventory, Kosmetik | Halaman Shop (on-chain), integrasi model 3D kosmetik (equip), Leaderboard UI, Polish Audio/VFX. | Aset 3D final tersedia. |

---

## 10. Module Breakdown (Contoh 1 Modul)

**Module: Ghost Replay System**
* **Purpose**: Memungkinkan pertandingan PvP tanpa koneksi *real-time* yang mensyaratkan 2 pemain online bersamaan.
* **Dependencies**: `Game Engine (Input System)`, `Backend API (Match Storage)`.
* **Owner**: Backend & Engine Devs.
* **Input**: Data vektor ketegangan busur, sudut kamera, *seed* angin (dari klien).
* **Output**: Rangkaian gerak musuh (*ghost avatar*) dan konfirmasi validasi skor (dari server).
* **Testing Requirement**: *Deterministic Test* (Input yang sama harus menghasilkan jarak tumbukan `< 0.001 units` di 10 putaran berturut-turut).
* **Definition of Done**: Klien bisa mengunduh *ghost payload*, memainkannya di layar tanpa jeda visual, dan skor sesuai rekor DB.

---

## 11. Implementation Priority

* **Critical**: Auth (SIWE), Database Core, Smart Contract (Shop & SBT), Game Engine (Physics & Rendering), Ghost PvP Pipeline. (Fokus MVP).
* **High**: UI Dashboard, Inventory System, Equipment 3D swapping, HUD sinkronisasi.
* **Medium**: Leaderboard ELO, History Match, Web3 *Minting* UI, Audio System.
* **Low**: Season Pass progression (bisa ditunda paska-rilis), Tutorial Interaktif.
* **Technical Debt (Tertunda)**: Skalabilitas Redis Cluster, Optimasi geometri mikro (LOD).
* **Future**: Mode Turnamen Langsung (Real-time WebRTC).

---

## 12. Testing Strategy

* **Unit Test**: Untuk logika murni (Misal: Rumus Kalkulasi ELO, Fungsi Pembantu Format Mata Uang). Berjalan seketika per-file (*Vitest/Jest*).
* **Contract Test**: Pengujian *Smart Contract* (Hardhat/Foundry) simulasi *exploit* dan verifikasi matematika token.
* **Integration Test**: Menguji modul Backend API + Database lokal di dalam wadah Docker lokal (Testcontainers).
* **Game Engine Test (Deterministic Test)**: Skrip tanpa bingkai perender (*headless*) yang memasukkan data panah spesifik dan mengonfirmasi peluru mengenai area spesifik di akhir simulasi.
* **E2E Test (End-to-End)**: Pengujian alur utuh (*Playwright*) dari masuk web, dompet tiruan (mock), masuk arena, hingga melihat hasil skor. Dijalankan menjelang *merge* rilis.

---

## 13. Code Review Checklist

* [ ] **Architecture**: Apakah perubahan sesuai ranah paket? (Contoh: Tidak ada kode SQL di Frontend).
* [ ] **Naming**: Penamaan jelas, sesuai standar, dan menggunakan terminologi dari *Blueprint*.
* [ ] **Performance**: Adakah potensi *Memory Leak* (terutama WebGL/Three.js *dispose*)? Adakah kueri N+1 di Backend?
* [ ] **Security**: Adakah vektor *XSS* di Frontend? Apakah input dari klien di backend telah divalidasi mutlak (*Zod / class-validator*)?
* [ ] **Reusability**: Bisakah komponen UI ini digeneralisasi alih-alih dikhususkan?
* [ ] **Test Coverage**: Apakah fungsi kritis (seperti perhitungan ekonomi atau fisika) sudah memiliki *Unit Test* baru?
* [ ] **Documentation**: Jika memperbarui atau menambah *endpoint* API atau Kontrak, apakah dokumentasinya (Swagger/NatSpec) terbarui?

---

## 14. CI/CD Pipeline

```text
[ Developer Pushes Code to PR ]
        |
        v
+-------------------------------------------------------+
|                   GITHUB ACTIONS CI                   |
+-------------------------------------------------------+
|  1. Linting & Formatting (ESLint, Prettier)           |
|  2. Type Checking (tsc --noEmit)                      |
|  3. Unit & Contract Tests (Vitest, Hardhat test)      |
|  4. Build Monorepo (Turbo run build)                  |
+-------------------------------------------------------+
        | (If Failed -> Block PR)
        | (If Passed)
        v
[ Peer Code Review & Merge to 'main' ]
        |
        v
+-------------------------------------------------------+
|                   GITHUB ACTIONS CD                   |
+-------------------------------------------------------+
|  1. Dockerize / Bundle Artifacts                      |
|  2. Push to Container Registry (Backend)              |
|  3. Push to Vercel/S3 (Frontend)                      |
|  4. Deploy to Staging Environment                     |
|  5. Run Automated E2E Smoke Tests                     |
|  6. Manual Approval for Production Deployment         |
+-------------------------------------------------------+
```

---

## 15. Environment Strategy

* **Local**: Komputer pengembang. Backend berjalan melalui `npm run dev` atau docker-compose untuk DB/Redis. Frontend terhubung ke RPC *Testnet* / *Local Hardhat Node*.
* **Development**: Integrasi berkelanjutan untuk melihat fitur terbaru. Database riskan di-*reset*. Berjalan di *Testnet* kripto.
* **Staging**: Repilka mutlak lingkungan *Production*. Menggunakan data *dummy* tapi arsitektur infrastruktur setara Production. Untuk pengujian jaminan mutu (QA).
* **Production**: Lingkungan langsung (Live) pengguna. *Mainnet* kripto (misalnya Polygon/Base). Akses ke rahasia (*secrets*) sangat dibatasi.

---

## 16. Configuration Management

* **Environment Variable**: Disimpan dalam berkas `.env` (tidak masuk ke *source control*). Setiap paket memiliki berkas `.env.example`.
* **Secrets**: *Private Key* akun penyebar kontrak, *API Key* layanan pihak ketiga disimpan aman di *GitHub Secrets* atau *AWS Secrets Manager*.
* **Contract Addresses**: Disimpan di konfigurasi terpusat (contoh: `packages/config/src/addresses.ts`) dibedakan berdasarkan `chainId`.
* **RPC Configuration**: URL *Fallback provider* yang beragam untuk menghindari kelumpuhan jika satu *node* Web3 sedang bermasalah.

---

## 17. Documentation Strategy

* **README.md (Global)**: Perintah dasar instalasi, instalasi dependensi, `npm run dev`, `docker-compose up`.
* **API Specs**: Di-generate secara otomatis menggunakan antarmuka Swagger (di-hosting di URL `api.domain.com/docs`).
* **Smart Contract Specs**: Menggunakan standar NatSpec di atas fungsi-fungsi krusial, dan dokumen alamat penyebaran per-jaringan.
* **Architecture Decision Record (ADR)**: Catatan berumur panjang tentang *mengapa* sebuah keputusan besar diubah. (Contoh: `docs/adr/001-switch-from-cannon-to-custom-physics.md`).

---

## 18. Risk Register

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| **Teknis: RPC Failure** | Frontend gagal memuat aset NFT, login gagal. | Sistem Fallback RPC, cache state dompet agar UI dasar tetap menyala. |
| **Keamanan: Bot Auto-Play**| Eksploitasi skor otomatis merebut Leaderboard. | Validasi kurva rekaman (input terlalu mulus atau tidak masuk akal mesin tolak skor). |
| **Infrastruktur: WebGL Crash** | Game hilang di tengah PvP karena kehabisan RAM ponsel. | Profiling memori ketat. Pool Object pra-alokasi. Resolusi terdegradasi otomatis untuk HP spek rendah. |
| **Blockchain: Biaya Gas Naik**| Pemain enggan meng-klaim SBT. | Merencanakan subsidi *Relayer (Biconomy/Account Abstraction)* di pembaruan selanjutnya. |

---

## 19. Release Strategy

1. **Closed Alpha**: Rilis internal untuk 10-20 pengguna (pengembang, QA, tim produk) di *Testnet*.
2. **Open Alpha (Testnet)**: Publik boleh mencoba di Testnet. Hadiah bagi penemu kutu (Bug Bounty). Uji beban (*Load Test*) pada antrean Matchmaking.
3. **Beta (Mainnet Soft Launch)**: Rilis mainnet dengan batasan suplai (tidak ada NFT Legendary). Tes ekonomi kripto skala kecil.
4. **Production (Season 1 Launch)**: Kampanye pemasaran, peluncuran *Season Pass* penuh, kolaborasi *Guild* Web3.
5. **Rollback Plan**: Jika Backend runtuh paska rilis, *docker image* dikembalikan (revert) ke tag sebelumnya via CI/CD. Smart Contract (jika dapat di-*upgrade* via UUPS) memiliki batas akses *Multisig* yang ketat.

---

## 20. Definition of Done (DoD)

Sebuah *Task / Issue* hanya dapat ditutup (dinyatakan selesai) jika:

* [ ] Kode telah selesai ditulis (Code Complete).
* [ ] Melewati *Peer Code Review* (Minimal 1 penyetuju).
* [ ] *Unit Tests* lulus untuk setiap logika baru (Test Passed).
* [ ] *Type Checker (TypeScript)* tidak mengeluarkan galat (Type Check Passed).
* [ ] Melewati *Linter* (ESLint/Prettier).
* [ ] *Build pipeline* kompilasi monorepo di CI menyala hijau (Build Passed).
* [ ] Dokumentasi komponen atau Swagger (jika terkait API) telah dimutakhirkan.
* [ ] Disetujui oleh fungsi *Product* di lingkungan *Staging*.

---

## 21. AI Development Workflow

Proyek ini dipersiapkan untuk dikembangkan melalui **AI Agent** (*seperti AI Code Assistants*). Ikuti panduan ketat ini untuk mencegah halusinasi dan degradasi arsitektur:

* **Pecahan Tugas (Task Chunking)**: AI tidak boleh diminta membuat fitur besar sekalgus ("Buat sistem PvP"). Tugas harus diurai mikro: "Buat endpoint API untuk Submit Score PvP", lalu prompt berikutnya: "Buat interaksi Frontend untuk memanggil API Submit Score."
* **Batasan Ruang Lingkup**: Satu *prompt* eksekusi implementasi hanya boleh mencakup batas **maksimal 2 direktori paket** (misal: `apps/api` dan `packages/types`).
* **Perlindungan Arsitektur**: Beri perintah absolut pada awal *prompt*: **"JANGAN memodifikasi dokumen arsitektur, jangan mengganti pustaka inti yang sudah ditentukan di package.json, jangan membuat file di luar ranah folder aplikasi terkait."**
* **Otomasi Pengujian**: Setengah dari siklus *prompt* AI harus digunakan untuk menghasilkan *Unit Test*. Tuntut AI: **"Sebelum Anda memodifikasi kode inti, pahami kerangka tes saat ini dan hasilkan file tes untuk skenario XYZ."**
* **Konsistensi Lintas Sprint**: Karena memori agen mungkin tidak mencakup keseluruhan proyek, mulailah pengerjaan modul baru dengan melampirkan berkas `Development_Playbook.md` beserta dokumen SDS spesifik area tersebut (misal `Game_Engine_SDS.md` jika meminta implementasi fisika).

---

## 22. Prompting Strategy

Gunakan templat ini saat menugaskan agen AI untuk melakukan implementasi fitur:

```markdown
Kamu adalah Principal Software Engineer. Tugasmu adalah mengimplementasikan fitur spesifik dari sistem.
Gunakan stack yang telah disetujui. Ikuti pedoman pada `Development_Playbook.md`.

**Objective**: 
[Contoh: Buat endpoint REST API NestJS untuk menyimpan riwayat Ghost Match]

**Context**: 
[Contoh: Lihat Backend_SDS.md Bagian 4. API ini menerima input JSON Ghost dari Frontend.]

**Scope (Batasan Modul)**:
- HANYA bekerja pada direktori: `apps/api/src/match` dan `packages/types/src/match.ts`

**Files Forbidden to Modify**:
- Dilarang memodifikasi konfigurasi database utama atau modul `auth`.

**Acceptance Criteria**:
1. Endpoint menerima `POST /api/v1/match/ghost`.
2. Validasi payload menggunakan Zod/class-validator.
3. Menyimpan payload ke penyimpanan S3 tiruan/lokal (Local File untuk saat ini).
4. Mengembalikan HTTP 201 dengan ID rekaman.

**Testing Requirement**:
Hasilkan berkas tes (Jest) untuk fungsi Controller ini minimal memuat 2 kasus: Suskes (HTTP 201) dan Gagal Validasi (HTTP 400).

**Output Requirement**:
Outputkan kode penuh (bukan pseudocode) dan tulis file ke workspace. Jangan berikan analisis panjang kecuali ditanya.
```

---

## 23. Decision Matrix (Development Ekosistem)

| Keputusan | Alternatif Dipertimbangkan | Kelebihan (Alasan Akhir) | Kekurangan |
| :--- | :--- | :--- | :--- |
| **Struktur Repositori** | *Polyrepo* (Repositori Terpisah per layanan) | **Monorepo**: Menghilangkan gesekan manajemen tipe (*TypeScript definitions*). Mengubah antarmuka kontrak langsung merusak (dan mencegah galat di) aplikasi Frontend yang mengonsumsinya secara bersamaan. | Konfigurasi CI/CD (*Turborepo*) di awal sedikit lebih rumit. |
| **Pendekatan Modul** | *Layer-First* (Bekerja di lapis DB penuh dulu, baru API penuh, baru Web) | **Feature-First / Vertical Slice**: Memastikan rilis fungsional. Mencegah investasi besar di Backend untuk fitur yang Frontend-nya belum tentu bisa/selesai dibuat. | Modul infra harus dibangun berulang per fitur. |
| **Lingkungan Pengembangan**| Instalasi manual PostgreSQL/Redis di lokal OS | **Docker Compose Lokal**: Lingkungan identik antar pengembang OS Mac/Windows/Linux. Tidak ada *konflik versi node*. | Beban memori (RAM) saat menjalankan *Docker Desktop*. |
| **Sistem Uji UI (E2E)** | Selenium | **Playwright**: Modern, kencang, terintegrasi paralel, lebih adaptif dengan DOM modern (React Canvas) dan menjembatani ejekan koneksi dompet Web3 lebih gampang. | Bahasa pemrograman pengujian kaku ke JS/TS. |
| **Deployment App Server**| Kubernetes (K8S) | **Platform-as-a-Service (Vercel/Render) / Docker Swarm Sederhana**: Mempercepat MVP. Skala Kubernetes terlalu kompleks bagi beban kerja REST API GameFi di tahap awal. | Kendali infra lebih sedikit di lingkungan mikro-services murni. |

---
*Dokumen Development Playbook ini menjadi garis dasar (Baseline) pengerjaan sistem dan harus dipatuhi secara ketat dalam seluruh siklus Sprint yang mengimplementasikan rancangan arsitektur sebelumnya.*
