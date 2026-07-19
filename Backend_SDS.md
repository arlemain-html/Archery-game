# Backend Software Design Specification (SDS): GameFi Archery Web3

---

## 1. Backend Overview

Filosofi backend ini didesain berdasarkan pola **Modular Monolith** menggunakan NestJS. Tujuannya adalah mempercepat kecepatan iterasi (Time-to-Market) pada fase MVP tanpa mengorbankan skalabilitas masa depan.

*   **Mengapa Modular Monolith?**: Menulis semuanya dalam satu *codebase* memudahkan pelacakan bug (*tracing*), penyebaran (*deployment*), dan refactoring antarmodul. Pembagian berdasarkan domain (Modul) memastikan bahwa batas (*boundaries*) kode tetap ketat. Jika trafik meningkat drastis, sebuah modul (misal: `GameplayModule`) dapat dipisahkan menjadi *Microservice* mandiri dengan sedikit usaha, karena logika bisnisnya tidak bocor ke modul lain.
*   **Batas Tanggung Jawab**: Backend adalah pemegang kebenaran mutlak (*Single Source of Truth*) untuk logika *gameplay*, *anti-cheat* (fisika), profil, inventaris off-chain, dan sinkronisasi blockchain. Backend TIDAK menyajikan UI (Tugas Frontend) dan TIDAK menyimpan saldo aset kripto (Tugas Blockchain).

---

## 2. Service Architecture

Arsitektur aplikasi dipisahkan menjadi *domain services* yang saling berinteraksi secara ketat.

*   **Authentication Service**: Menerbitkan token JWT berdasarkan validasi EIP-4361 (SIWE).
*   **User & Profile Service**: Mengelola data dasar pemain dan statistik menang/kalah.
*   **Inventory & Equipment Service**: Validasi status kepemilikan aset (Web2 & Web3) dan manajemen *loadout* karakter.
*   **Gameplay Service**: Menerima vektor tarikan panah, menjalankan validasi fisika *server-authoritative*, menentukan skor absolut.
*   **Ghost Replay Service**: Menarik rekaman JSON dari S3 dan mengemasnya untuk *matchmaking*.
*   **Leaderboard Service**: Sinkronisasi instan skor ELO ke Redis ZSET.
*   **Match & Analytics Service**: Rekam jejak historis ronde, menghitung rasio akurasi, performa *win rate*.
*   **Achievement & Mission Service**: Evaluasi harian (Daily Quest), memproduksi EIP-712 *Signature* untuk klaim on-chain.
*   **Season Service**: Penjadwalan *reset* musim dan *soft-reset* ELO.
*   **Shop Service**: Mengatur katalog, harga, potongan mata uang *off-chain*, integrasi *receipt* Web3.
*   **Blockchain & Indexer Service**: Mengekstrak *Event* (ABI) via RPC dan mendistribusikannya via RabbitMQ.
*   **Notification Service**: Meneruskan pesan WebSocket ke Frontend.
*   **Storage Service**: Jembatan abstrak ke sistem AWS S3/CDN.

**Dependency Flow Diagram**:
```text
[API Gateway / Controller Layer]
          |
          v
+-------------------+   +--------------------+   +-------------------+
|  Gameplay Service |-->| Leaderboard Service|-->|Achievement Service|
+-------------------+   +--------------------+   +-------------------+
          |                       |                        |
          v                       v                        v
+-------------------+   +--------------------+   +-------------------+
|  Storage Service  |   |    Redis Cache     |   |Blockchain Service |
| (S3 Ghost Upload) |   | (Update ZSET Rank) |   | (EIP-712 Signer)  |
+-------------------+   +--------------------+   +-------------------+
```

---

## 3. API Architecture

Segmentasi rute untuk mencegah kebocoran *privilege*:

*   **Public API** (`/api/v1/public/*`): Diakses tanpa otentikasi. (Contoh: Konfigurasi sistem, status kesehatan, *leaderboard* publik).
*   **Authenticated API** (`/api/v1/*`): Mewajibkan JWT yang valid di *header*. Akses data dibatasi ketat berdasarkan `user_id` di JWT (Pemain tidak bisa mengubah data pemain lain).
*   **Admin API** (`/api/v1/admin/*`): Mewajibkan peran Admin/Staff di JWT. Untuk *ban* pengguna, *refund*, penyesuaian musim.
*   **Internal API / Worker API** (`/api/v1/internal/*`): Dijalankan pada *port* tersembunyi yang hanya bisa dipanggil dalam *Virtual Private Cloud (VPC)*. Digunakan oleh Indexer Worker untuk memberi tahu *Core Backend* tentang kejadian blockchain jika menggunakan arsitektur HTTP *Webhook* sekunder.

---

## 4. REST API Specification

Seluruh endpoint mengembalikan JSON. Berikut spesifikasi level tinggi (tanpa implementasi kelas DTO).

### Authentication & Profile
| Method | URL | Auth | Request (Body/Query) | Response | Validation | Rate Limit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/auth/nonce` | No | `?wallet={address}` | `{"nonce": "string"}` | Wallet regex | 10/min |
| `POST`| `/auth/verify`| No | `{"message": "SIWE", "signature": "0x..."}` | `{"accessToken": "...", "refreshToken": "..."}` | ecrecover | 5/min |
| `GET` | `/profile/me` | Yes | - | `{"user": {...}, "stats": {...}}` | JWT Check | 60/min |

### Inventory & Equipment
| Method | URL | Auth | Request (Body/Query) | Response | Validation | Idempotency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/inventory` | Yes | `?type=bow&page=1` | `{"data": [...], "cursor": "..."}` | Query enum | Yes |
| `POST`| `/equipment` | Yes | `{"skuId": "string"}` | `{"success": true}` | Must own item | Yes (PUT semantics) |

### Gameplay & Match
| Method | URL | Auth | Request (Body/Query) | Response | Validation | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST`| `/match/find` | Yes | `{"mode": "pvp"}` | `{"matchId": "uuid", "ghost": {...}}` | - | 201 Created |
| `POST`| `/match/submit`| Yes | `{"matchId": "uuid", "inputs": [...]}` | `{"score": 250, "eloChange": +15}`| Validasi Fisika | 200 OK |

### Achievement & Shop
| Method | URL | Auth | Request (Body/Query) | Response | Validation | Error Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST`| `/achievement/claim`| Yes | `{"achievementId": "string"}` | `{"signature": "0x...", "nonce": 12}` | Syarat terpenuhi | `400 Not Eligible` |
| `GET` | `/shop/catalog` | Yes | - | `{"items": [...]}` | - | - |
| `POST`| `/shop/buy-offchain`| Yes | `{"skuId": "string"}` | `{"success": true, "balance": 100}` | Cek Saldo & FOR UPDATE | `402 Insufficient Funds` |

*(Spesifikasi di atas merupakan subset acuan dari 100+ rute API sesungguhnya)*

---

## 5. Authentication Flow (EIP-4361: SIWE)

Sistem masuk murni mengandalkan dompet Web3 tanpa kewajiban *email/password*.

1.  **Wallet Connect**: Klien menghubungkan MetaMask/WalletConnect.
2.  **Nonce Request**: Klien memanggil `GET /auth/nonce`. Backend men- *generate* UUID secara kriptografis, menyimpannya di Redis (`auth_nonce:{wallet} => UUID`, TTL: 5 menit), dan merespons klien.
3.  **SIWE (Sign-In with Ethereum)**: Klien merangkai pesan standar EIP-4361 menggunakan *Nonce* tersebut dan menandatanganinya (`personal_sign`).
4.  **Verification**: Klien mengirim *Signature* ke `POST /auth/verify`. Backend mengeksekusi `ecrecover` untuk memastikan alamat yang keluar cocok dengan yang diklaim.
5.  **JWT Issue**: Backend menghapus *Nonce* dari Redis (Replay Protection). Backend menerbitkan *Short-lived JWT Access Token* (1 Jam) dan *HttpOnly Secure Cookie Refresh Token* (7 Hari).
6.  **Session & Device**: ID sesi (*JTI*) dicatat di Redis. Untuk *Logout*, ID sesi ini masuk *blacklist*, mengamankan perangkat yang dicuri.

---

## 6. Gameplay API Flow

1.  **Play**: Klien memanggil `POST /match/find`.
2.  **Fetch Ghost**: Backend mengekstrak nilai ELO klien, mencari `user_id` lawan dengan selisih $\pm$ 50 ELO di *Redis Matchmaking Pool*, mengambil URL S3 dari `Ghost_Replays`, dan memberikan URL prasetandatangan (*Presigned URL*) ke klien.
3.  **Submit Input**: Setelah klien bermain 5 ronde, array tarikan panah (vektor, *wind offset*, *timing*) dikirim via `POST /match/submit`.
4.  **Validation**: Layanan *Physics Authoritative* merender kalkulasi matematis tanpa GPU (*headless*) untuk memverifikasi lintasan tabrakan (*Collision*).
5.  **Score & Reward**: Jika skor akurat, layanan menghitung perubahan ELO. Memberikan XP tambahan.
6.  **History & Leaderboard**: Log disimpan di `Matches`, ELO diperbarui di `Redis ZSET`.
7.  **Achievement**: `AchievementService` memindai jika pertandingan ini membuka `Win Streak 10x` dan menyimpan statusnya (Eligible).

---

## 7. Shop API Flow (Web3 Purchase)

1.  **Open Shop**: Klien memanggil `GET /shop/catalog` untuk mendapatkan harga dari Redis/DB.
2.  **Purchase (Blockchain)**: Klien memanggil fungsi `buyItem()` langsung pada *Smart Contract* melalui dompetnya sendiri (Bukan via API Backend).
3.  **Indexer Worker**: Menangkap event `ItemPurchased(buyer, skuId)`. Memasukkannya ke RabbitMQ.
4.  **Backend (Queue Consumer)**: Mengonsumsi pesan MQ, memeriksa *tx_hash* sebagai *Idempotency Key*.
5.  **Inventory**: Tabel `Inventory` ditambahkan kuantitasnya.
6.  **WebSocket Notification**: Backend memancarkan (emit) notifikasi WSS: `"Item berhasil dibeli!"`. Klien bereaksi dengan merender halaman ulang.

---

## 8. Achievement API Flow (Soulbound Token Claim)

1.  **Eligible**: Backend (saat *match* usai) mendeteksi bahwa pemain telah menyelesaikan prasyarat misi. Kolom `is_eligible` di PostgreSQL diubah menjadi `true`.
2.  **Claim Signature**: Pemain menekan tombol klaim. API `/achievement/claim` mengecek status `is_eligible`. Jika benar, backend menggunakan *Kunci Privat KMS* untuk membuat *EIP-712 Signature* yang mengikat `Wallet + AchievementID + Nonce`. Backend mengubah status DB ke `claim_pending`.
3.  **Mint**: Pemain menerima *Signature* sebagai respons JSON, dan menggunakannya untuk memanggil `mintSBT()` di Blockchain.
4.  **Indexer**: Event `SBTMinted` tertangkap.
5.  **Profile**: Backend mengubah status misi di database menjadi `claimed_on_chain`. SBT terpasang permanen di profil.

---

## 9. Queue & Worker Architecture

Pengolahan beban asinkron diserahkan kepada *Message Broker* (RabbitMQ) untuk menjamin ketahanan terhadap lonjakan beban (*Peak Traffic*).

*   **Replay Worker**: Menangani unggahan *(uploading)* potongan JSON fisika *Ghost Replay* besar ke Amazon S3 setelah validasi *gameplay*, agar modul API tidak terblokir (Non-blocking I/O).
*   **Indexer Worker**: Mengonsumsi pesan dari layanan ekstraksi log Blockchain. Mengorkestrasi injeksi basis data yang ketat terhadap *race condition*.
*   **Notification Worker**: Mengirim notifikasi WebSocket skala besar (contoh: "Server sedang *maintenance*").
*   **Analytics Worker**: Mentransfer ribuan baris `Match_Stats` per jam ke *Data Warehouse* (ETL Process).
*   **Season Worker**: Dieksekusi secara periodik (cron-driven) di akhir musim untuk melakukan proses perhitungan hadiah masif ke jutaan pemain.

---

## 10. WebSocket Design

Penyediaan data waktu-nyata (*real-time*) berpusat pada optimalisasi pengalaman pengguna tanpa poling (HTTP Polling).

*   **Teknologi**: Socket.io atau murni `ws` (tergantung kebutuhan *fallback*).
*   **Publisher**: Backend Service (via Redis Pub/Sub Adapter untuk dukungan multi-kontainer Node.js).
*   **Subscriber**: Klien React di Browser. Klien tergabung (join) dalam ruang (*room*) privat `user_{id}` dan ruang publik `global`.
*   **Payload Format**: `{"event": "INVENTORY_UPDATED", "data": {"sku": "A1", "qty": 1}, "timestamp": 172948281}`.
*   **Heartbeat (Ping/Pong)**: Dikirim setiap 25 detik agar Load Balancer (Nginx/AWS ALB) tidak memutus koneksi panjang (*idle connection drop*).
*   **Reconnect Strategy**: Klien mencoba menyambung ulang dengan waktu mundur eksponensial (1s, 2s, 4s, 8s) jika koneksi RPC terputus.

---

## 11. Background Jobs (Cron)

*   **Daily Reset (00:00 UTC)**: Me- *reset* kuota misi harian (Daily Quest) dan menyebarkan misi acak baru.
*   **Weekly Reset (00:00 UTC, Senin)**: Mereset misi mingguan.
*   **Season Reset (Hari ke-30)**: Membekukan `Redis Leaderboard`. Menulis *snapshot* ELO permanen ke database, memberikan gelar, menciutkan (*soft-reset*) ELO kembali ke batas dasar liga.
*   **Leaderboard Snapshot**: Cadangan sementara papan peringkat Redis ke PostgreSQL tiap 1 jam (mitigasi bencana jika Redis *crash* sebelum *AOF persist*).
*   **Metadata Sync**: Me- *refresh* tautan metadata gambar S3 jika terdapat ubahan pada parameter aset.

---

## 12. Validation Layer

Penggunaan pola *Decorator* berlapis (terinspirasi dari NestJS `class-validator` / Zod).

*   **Request Validation (DTO)**: Memastikan format HTTP (tipe data, string panjang maksimum, email format, JSON schema) tidak rusak sebelum menyentuh Controller.
*   **Business Validation**: Apakah pemain mencoba membeli barang yang menuntut level 50, padahal levelnya 10?
*   **Database Validation**: Penggunaan `FOR UPDATE` untuk memvalidasi bahwa sisa stok kupon (Inventory) tidak menjadi negatif saat balapan (*race condition*).
*   **Blockchain Validation**: Memeriksa *Block Confirmations* (Mencegah *reorg* curang).
*   **Replay Validation**: Menolak JSON Replay jika mendeteksi anomali kecepatan panah melebihi ambang batas (*speed hack threshold*).

---

## 13. Error Handling

Standardisasi respons ketika terjadi anomali (Diformat via NestJS `ExceptionFilter`).

*   **Validation Error (400)**: `ERR_VALIDATION` (Format input salah).
*   **Authentication Error (401)**: `ERR_UNAUTHORIZED` (JWT hilang atau kedaluwarsa).
*   **Authorization Error (403)**: `ERR_FORBIDDEN` (Mencoba membobol klaim NFT orang lain).
*   **Business Error (422)**: `ERR_INSUFFICIENT_FUNDS` atau `ERR_REQUIREMENT_NOT_MET`.
*   **Rate Limit (429)**: `ERR_TOO_MANY_REQUESTS`.
*   **Internal Error (500)**: `ERR_INTERNAL_SERVER`. (Isi error hanya memberikan UUID *Trace ID* kepada pengguna; detail *stack trace* disembunyikan dan log ke Sentry).

---

## 14. Response Standard

Respons API mengikuti struktur pembungkus statis (*envelope structure*) untuk mempermudah peruraian (*parsing*) klien.

**Success (200/201)**:
```json
{
  "success": true,
  "data": { "key": "value" },
  "metadata": {
     "timestamp": "2026-07-16T12:00:00Z",
     "requestId": "req-uuid-1234"
  }
}
```

**Pagination Cursor-based (Daftar History/Leaderboard)**:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { "nextCursor": "eyJwYWdlIjoyfQ==", "hasNextPage": true }
}
```

**Error (4xx/5xx)**:
```json
{
  "success": false,
  "error": {
    "code": "ERR_INSUFFICIENT_FUNDS",
    "message": "Soft currency balance is not enough.",
    "traceId": "err-uuid-9876"
  }
}
```

---

## 15. Security

*   **CORS**: Dibatasi hanya untuk nama domain produksi (misal: `https://play.archerydapp.com`).
*   **CSRF**: Dilindungi karena arsitektur sepenuhnya *Stateless API* (Bearer JWT Header), yang mana kebal terhadap eksploitasi serangan pembajakan Cookie (CSRF) dibandingkan Session Cookie Tradisional (selama klien tidak menyimpan JWT di LocalStorage secara sembarangan, idealnya dipadukan dengan *HttpOnly Refresh Token*).
*   **Brute Force**: Pembatasan laju (*Rate Limit*) ketat pada API verifikasi dompet (5 percobaan per menit).
*   **SQL Injection**: Mustahil berkat penggunaan ORM bertipe (*TypeORM/Prisma*) dan parameter terikat (*Prepared Statements*).
*   **DOS Mitigation**: Batasan *Payload Size* maksimal (contoh 2MB) pada API `/match/submit` untuk mencegah klien mengunggah berkas JSON biner raksasa yang menyebabkan habisnya memori Node.js (*OOM*).

---

## 16. Monitoring

Infrastruktur Visibilitas (*Observability*) kelas pro.

*   **Health Check (`/health`)**: Memeriksa koneksi DB, Redis, dan MQ. Digunakan oleh *Load Balancer* Kubernetes (Liveness/Readiness Probes).
*   **Metrics**: Terekspos di `/metrics` untuk ditarik (*scrape*) oleh Prometheus. Mengukur "Durasi eksekusi API Gameplay", "Tingkat error transaksi Web3".
*   **Logging**: Menggunakan arsitektur JSON murni (Winston/Pino) agar mudah ditelan oleh Elasticsearch/Datadog. Tidak ada pencatatan informasi PII.
*   **Alerting**: Sinyal peringatan Telegram/Slack jika *Dead Letter Queue* di RabbitMQ melebihi 100 antrean (Menandakan kegagalan *Smart Contract Sync* yang masif).

---

## 17. Folder Structure (NestJS Modular Context)

```text
/backend-api
 ├── src/
 │   ├── main.ts                   # Bootstrapper
 │   ├── config/                   # Validasi Environtment Variables (Joi/Zod)
 │   ├── common/                   # Global (Filters, Interceptors, Decorators, Guards)
 │   ├── database/                 # Konfigurasi Koneksi & Prisma/TypeORM Schema
 │   ├── modules/                  # Domain-Driven Modules
 │   │   ├── auth/                 # SIWE Logic
 │   │   ├── user/                 # Profile & Stats
 │   │   ├── gameplay/             # Physics Validator Core
 │   │   ├── inventory/            # Web2 & Web3 Merged Items
 │   │   ├── shop/                 # Commerce Logic
 │   │   └── indexer/              # Web3 Event Listener
 │   ├── queue/                    # RabbitMQ Producers & Consumers
 │   ├── workers/                  # Background Jobs (Cron Tasks)
 │   └── websocket/                # Socket.io Gateways
 ├── tests/                        # E2E dan Unit Tests
 └── scripts/                      # DB Seeders
```

---

## 18. Decision Matrix

| Kategori | Opsi | Solusi Terpilih | Alasan & Kompromi |
| :--- | :--- | :--- | :--- |
| **API Format** | GraphQL vs REST | **REST API** | Model game relatif statis, aliran data (*flow*) tidak sedalam/se-bersarang (nested) aplikasi jejaring sosial. REST lebih sederhana untuk di- *cache* pada tingkat CDN/Edge dan performa *parsing*-nya instan. |
| **Node Framework** | Express vs NestJS | **NestJS** | Ketegasan arsitektural. Injeksi Dependensi (DI) bawaannya membuat tes *mocking* untuk validasi *Smart Contract* jauh lebih tertata. |
| **Auth State** | Session/Redis vs JWT | **JWT (Stateless)** | JWT sangat mudah ditingkatkan skalanya (*scaled*) pada server yang jumlahnya berlipat ganda karena server tidak perlu menanyakan DB untuk memverifikasi siapa pengguna tersebut, menghemat miliaran beban bacaan Redis/DB. |
| **Message Broker** | Redis Queue vs RabbitMQ | **RabbitMQ** | Untuk log transaksi NFT (*Indexer*), keamanan pesan dan sistem *Dead Letter Queue* sangat penting. Redis BullMQ bagus, tetapi MQ murni memiliki penanganan kegagalan (*durability*) level perusahaan yang lebih mapan. |
| **Notifikasi Klien** | Long-Polling vs WebSocket | **WebSocket** | Pembaruan ketersediaan item *Shop*, *matchmaking*, dan *leaderboard* bersifat *real-time*. *Polling* akan menghanguskan sumber daya peladen (server CPU & Bandwidth). |
| **Skala Sistem** | Microservices vs Monolith | **Modular Monolith** | Microservices pada fase MVP hanya menjamin "Neraka Operasional" (DevOps Overkill). Menggunakan Modul Monolitik yang dirancang baik adalah kompromi peraih kecepatan *development* terbaik, namun gampang dipecah kapan saja nanti. |
