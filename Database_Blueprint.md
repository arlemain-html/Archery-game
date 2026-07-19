# Database Architecture & Design Blueprint: GameFi Archery Web3

---

## 1. Database Overview

### Filosofi Desain Database
Desain basis data ini mengadopsi prinsip **Highly Normalized (3NF)** untuk menjaga integritas dan konsistensi data finansial serta inventaris pemain. Konsep utamanya adalah pemisahan beban kerja (*Separation of Concerns*):
- **OLTP (Online Transaction Processing)**: Ditangani oleh PostgreSQL untuk mencatat transaksi pemain sehari-hari (inventory, match, profile) yang membutuhkan jaminan ACID mutlak.
- **OLAP (Online Analytical Processing)**: Ditangani oleh Data Warehouse terpisah untuk menghindari beban *query* analitik berat yang bisa mengganggu performa *gameplay*.

### Mengapa Memilih PostgreSQL (Primary)
PostgreSQL dipilih karena keandalannya dalam menangani transaksi finansial (ACID). Fitur **JSONB** sangat krusial di Web3 karena memungkinkan kita menyimpan *metadata* NFT dan atribut *Ghost Replay* yang skemanya bisa berubah sewaktu-waktu tanpa harus melakukan migrasi kolom terus-menerus. Selain itu, fitur penguncian baris (`FOR UPDATE`) sangat esensial untuk mencegah *race condition* atau duplikasi item (Double Spend).

### Mengapa Menggunakan Redis (Supporting)
Basis data relasional tidak dirancang untuk pembaruan ribuan baris per detik secara konstan. Redis digunakan sebagai *buffer* berkinerja sangat tinggi untuk fitur spesifik:
- **Leaderboard (ZSET/Sorted Set)**: Pengurutan peringkat ELO secara instan.
- **Matchmaking Queue**: Antrean pencarian pemain dan *ghost replay*.
- **Session & Caching**: Cache data profil yang jarang berubah untuk mengurangi latensi API.

### Mengapa Replay Tidak Semuanya Disimpan di PostgreSQL
Sebuah *Ghost Replay* terdiri dari *array* vektor koordinat (X, Y, Z), waktu milidetik, dan parameter angin tiap tembakan. Ukurannya bisa mencapai puluhan hingga ratusan KB per pertandingan. Jika kita memiliki 1 Juta *match* per hari, tabel akan mengalami **Database Bloat** dan melambat drastis. Oleh karena itu, PostgreSQL hanya menyimpan *Metadata* (skor, siapa melawan siapa, ELO), sedangkan muatan JSON *Replay* berukuran besar disimpan sebagai berkas statis di **S3 Compatible Object Storage**, dengan URL referensi dicatat di database.

---

## 2. Complete ER Diagram

```text
                        +-----------------+
                        |   Season_Pass   |
                        +-----------------+
                                | (Belongs To)
                        +-----------------+        +------------------+
                        |      Users      | --1:M- |   Achievements   |
                        +-----------------+        +------------------+
                                |
          +-----------+---------+---------+-----------+-----------+
          |           |                   |           |           |
          1:1        1:M                 1:M         1:M         1:M
          |           |                   |           |           |
    +----------+ +-----------+    +-------------+ +--------+ +--------------+
    | Profiles | | Inventory |    | Match_Stats | | Orders | | Transactions |
    +----------+ +-----------+    +-------------+ +--------+ +--------------+
                       |                  |
                      1:1 (Equipped)     1:1
                       |                  |
                 +-----------+     +--------------+     +---------------+
                 | Equipment |     | Ghost_Replays| -+->|   S3 Storage  |
                 +-----------+     +--------------+  |  +---------------+
                       |                             |
                      M:1                            |
                       |                             |
                 +-----------+                       |
                 | Shop_Item | <---------------------+
                 +-----------+
```
*(Diagram ini merupakan gambaran relasi tingkat tinggi. Lihat Bagian 5 untuk detail lengkap).*

---

## 3. Entity Catalog

Berikut adalah daftar entitas inti yang dirancang:

**Core Identity & Profile**
- `Users` (Termasuk informasi Wallet)
- `Profiles`
- `Sessions`

**Economy & Inventory**
- `Inventory` (Kepemilikan aset off-chain & NFT)
- `Inventory_Transactions` (Log perpindahan barang/sinkronisasi)
- `Equipment_Loadout` (Apa yang sedang dipakai)
- `Items_Catalog` (Kamus referensi semua barang di game)

**Gameplay & Match**
- `Matches` (Sesi pertandingan & riwayat)
- `Match_Players` (Detail performa per pemain)
- `Ghost_Replays` (Metadata rekaman)

**Progression & Leaderboard**
- `Seasons` (Konfigurasi waktu per musim)
- `Season_Pass` (Progres pemain di suatu musim)
- `Leaderboards` (Snapshot historis peringkat)
- `Achievements` (Daftar syarat pencapaian)
- `User_Achievements` (Pencapaian yang telah dibuka)
- `SBT_Claims` (Log *minting* token on-chain)
- `Quests` (Daily/Weekly mission)

**Commerce**
- `Shop_Orders` (Pesanan pengguna)
- `Blockchain_Transactions` (Sinkronisasi *tx hash* dari Web3)
- `Soft_Currency_Ledger` (Buku besar uang *off-chain*)

**System & Logs**
- `Indexer_Sync_State` (Merekam blok terakhir yang dipindai)
- `System_Events`
- `Audit_Logs`

---

## 4. Detail Setiap Entity (Contoh Entitas Kritis)

### A. `Users`
- **Purpose**: Entitas jangkar (anchor) untuk semua aktivitas pemain.
- **Primary Key**: `id` (UUID).
- **Unique Constraint**: `wallet_address`, `username`.
- **Nullable**: `email`.
- **Estimated Record Size**: ~200 Bytes.
- **Growth Rate**: Lambat-Sedang (1x per pengguna mendaftar).
- **Index**: B-Tree pada `wallet_address` dan `username`.
- **Soft/Hard Delete**: Soft Delete (`is_active = false`) demi kepatuhan analitik historis.
- **Audit**: Ya (Kapan mendaftar, kapan dibanned).

### B. `Inventory`
- **Purpose**: Menyimpan barang fisik maya milik pengguna (baik NFT maupun poin biasa).
- **Primary Key**: `id` (UUID).
- **Foreign Key**: `user_id`, `item_id`.
- **Candidate Key**: Kombinasi (`user_id`, `item_id`, `token_id`).
- **Nullable**: `token_id` (jika bukan NFT, maka NULL).
- **Growth Rate**: Cepat (pengguna mendapat loot).
- **Partition Recommendation**: Berdasarkan rentang waktu perolehan (misal: PARTITION BY RANGE (`created_at`)) jika jumlah melebihi puluhan juta.
- **Index**: B-Tree pada `user_id`.

### C. `Matches`
- **Purpose**: Menyimpan log pertempuran.
- **Primary Key**: `id` (UUID).
- **Foreign Key**: `season_id`.
- **Growth Rate**: Sangat Cepat (Ribuan per hari).
- **Retention Policy**: Dipertahankan di PostgreSQL selama 90 Hari. Lebih dari itu, di- *archive* (Cold Storage).
- **Partition Recommendation**: PARTITION BY RANGE (`created_at`) secara mingguan/bulanan.
- **Audit Requirement**: Imutabel (Tidak boleh ada perintah UPDATE/DELETE setelah baris dimasukkan).

---

## 5. Relationship Design

### Diagram Relasi Kunci

1. **User Identity**
   Setiap akun pengguna menyimpan `wallet_address` secara langsung di tabel `Users` sebagai identitas unik, menghilangkan relasi terpisah untuk wallet demi performa query yang lebih baik. 
2. **User $\leftrightarrow$ Inventory (One-to-Many)**
   Satu pengguna memiliki banyak item. Relasi dijaga dengan FK `user_id` di tabel `Inventory`.
3. **Match $\leftrightarrow$ Match_Players (One-to-Many)**
   Satu baris `Matches` (Pertandingan) memiliki dua (2) baris `Match_Players` (Pemain A dan Hantu B). Pemisahan tabel ini (Normalisasi) memungkinkan ekspansi fitur di masa depan (misalnya mode 2v2 atau Battle Royale) tanpa mengubah skema dasar.
4. **Inventory $\leftrightarrow$ Equipment_Loadout (One-to-One)**
   Meskipun pemain punya 100 *Bow*, hanya 1 yang berada di `Equipment_Loadout` yang sedang aktif dipakai.
5. **Shop_Orders $\leftrightarrow$ Blockchain_Transactions (One-to-One)**
   Setiap pesanan toko on-chain harus berkorespondensi langsung dengan 1 buah Hash Transaksi (*tx_hash*) untuk rekonsiliasi.

---

## 6. Inventory Model

Model inventaris mengakomodasi ekonomi hibrid:
- **Off-chain Consumable / Soft Currency**: Bertumpuk (*Stackable*). Disimpan dengan kolom `quantity = N`, `is_nft = false`.
- **Unique NFT (ERC-721)**: Tidak bertumpuk. Disimpan 1 baris untuk 1 NFT. `quantity = 1`, `is_nft = true`, `token_id = "1024"`, `contract_address = "0x..."`.
- **Semi-Fungible NFT (ERC-1155)**: Bertumpuk on-chain. `quantity = N`, `is_nft = true`, `token_id = "5"`.

**Sinkronisasi & Keamanan**:
Perpindahan aset sangat rawan dimanipulasi. Seluruh perubahan inventaris wajib melalui tabel `Inventory_Transactions` (Buku Besar/Ledger).
*Flow: User Crafting Bow $\rightarrow$ Kurangi 5 Common Bow (Item Sink/Burn) $\rightarrow$ Tambah 1 Uncommon Bow (Item Source) $\rightarrow$ Keduanya ditulis dalam SATU Transaksi Database (`BEGIN ... COMMIT`).*

---

## 7. Match Database Design

Untuk mengakomodasi performa tinggi sekaligus menyimpan integritas *anti-cheat*:

*   `Matches` Table:
    *   `id`, `match_type` (PvP/Practice), `started_at`, `ended_at`, `season_id`, `status` (Finished/Aborted).
*   `Match_Players` Table:
    *   `match_id`, `user_id` (bisa null jika bot/ghost anonim), `is_ghost` (Boolean), `score_achieved` (Int), `accuracy_percentage` (Numeric), `elo_change` (Int), `equipped_snapshot` (JSONB - *Menyimpan equipment apa yang dipakai saat itu, agar replay akurat*).
*   `Ghost_Replays` Table:
    *   `match_id`, `s3_bucket_url` (Varchar), `file_hash_sha256` (Varchar - *Untuk memverifikasi integritas file dari eksploitasi peretasan CDN*), `client_version` (String).

**Replay Metadata Storage**: Array vektor sudut tembakan dan angin **TIDAK** ada di SQL. Disimpan sebagai `.json.gz` di S3 Bucket: `s3://game-replays/season-1/match-123.json.gz`.

---

## 8. Player Progression Database

Progresi pengguna membutuhkan pemisahan antara musiman (di- *reset*) dan permanen.

*   **Permanen**: `Users.xp`, `Users.level`, `User_Achievements` (SBT).
*   **Musiman (Seasonal)**: Tabel `Season_Pass` yang merelasikan `user_id` dan `season_id`. Memiliki kolom `current_tier` (Int), `pass_xp` (Int), `is_premium` (Boolean).
*   **Quests/Missions**: Tabel `User_Quests` menyimpan ID Misi (contoh: "Lakukan 10 Headshot"), `progress_count`, `target_count`, `expires_at` (menentukan harian/mingguan), dan `is_claimed`.

---

## 9. Economy Database

Desain ekonomi memastikan audit keuangan yang sempurna.

*   `Soft_Currency_Ledger`: Menyimpan saldo *off-chain point*. Menggunakan konsep akuntansi *Double-Entry* (Debit/Kredit) sederhana. Kolom `amount` (Bisa minus/plus), `transaction_type` (MatchReward, CraftingFee, ShopPurchase).
*   Saldo pemain *Soft Currency* didapat dari hasil penjumlahan (SUM) baris *ledger* mereka, bukan disetel statis (`UPDATE balance = 100`), atau dipadukan (Kolom saldo di *User* ada, tapi *Ledger* adalah referensi mutlak).
*   **Marketplace Sync & Royalty**: Transaksi pasar sekunder yang dibaca Indexer dicatat ke tabel `Blockchain_Transactions` dengan tipe `Secondary_Trade`, mencatat `buyer_wallet`, `seller_wallet`, `price_eth`, dan `royalty_eth_collected`. Ini memudahkan kalkulasi akuntansi pendapatan (*Revenue*) per bulan untuk developer.

---

## 10. Blockchain Synchronization

Database harus memiliki toleransi terhadap sifat asinkron dan ketidakpastian (*reorg*) blockchain.

**Indexer Flow to DB**:
```text
[Blockchain] 
   -> [Indexer Node] (Memeriksa blok baru)
   -> [RabbitMQ/Kafka] (Mendorong pesan "ItemMinted")
   -> [DB Worker] (Mengonsumsi antrean)
   -> [PostgreSQL] (Menjalankan transaksi, memperbarui Inventory)
```

**Mekanisme Keamanan Indexer**:
1.  **Confirmation (Reorg Handling)**: Indexer tidak memproses event blok `N`. Ia menunggu hingga blok `N+6` (atau finalisasi setara) untuk mencegah modifikasi database jika terjadi *Blockchain Reorganization*.
2.  **Duplicate Detection (Idempotency)**: Kunci unik (Unique Index) diletakkan pada kombinasi `(tx_hash, log_index)`. Jika pesan antrean ganda diproses ulang, database menolak klaim (*Conflict / ON CONFLICT DO NOTHING*), mencegah *double-spend*.
3.  **Dead Letter Queue (DLQ)**: Jika transaksi DB gagal (contoh: user tidak ada), pesan dilempar ke DLQ untuk diselidiki admin.

---

## 11. Caching Strategy

Redis beroperasi sebagai garda terdepan sebelum kueri mengenai PostgreSQL.

*   **Leaderboard**: Menggunakan tipe data `Sorted Set (ZSET)`. `ZADD season_1_leaderboard <elo_score> <user_id>`. Sangat ringan untuk melakukan `ZREVRANGE` (Top 100).
*   **Session**: JWT Token Validation, status *online/offline* pemain (TTL: 24 Jam).
*   **Profile & Inventory Cache**: Ketika pemain memanggil `/api/profile`, DB merespons dan meletakkannya di Redis dengan tipe *Hash* (TTL: 5 Menit). 
*   **Ghost Replay (Hot Cache)**: Replay dari *match* 1 jam terakhir diletakkan di Redis agar proses *matchmaking* instan, tidak perlu mengunduh dari S3 berulang kali (TTL: 1 Jam).
*   **Invalidation**: Ketika *Event* `InventoryUpdated` atau `MatchFinished` terpicu dari PostgreSQL, Worker secara eksplisit mengirimkan perintah `DEL user_profile_<id>` ke Redis (Cache-Aside pattern).

---

## 12. Data Lifecycle

Manajemen ruang penyimpanan menggunakan skema degradasi seiring umur data.

```text
[Siklus Hidup Tabel Matches & Replay]

0 - 30 Hari (HOT DATA)
  -> Tersimpan di PostgreSQL (Tabel Utama).
  -> Replay file di-cache di CDN & Redis.
  -> Sangat cepat diakses oleh pemain dari riwayat.

31 - 90 Hari (WARM DATA)
  -> Partisi PostgreSQL ditandai "Read Only".
  -> Replay file dihapus dari CDN, diakses perlahan dari S3 langsung.

> 90 Hari (COLD ARCHIVE)
  -> Baris data PostgreSQL di-dump (export) menjadi file Parquet.
  -> Dikirim ke Data Warehouse (BigQuery/Snowflake) untuk Analytics.
  -> Dihapus secara permanen dari basis data operasional PostgreSQL.
  -> Replay file S3 masuk ke kelas "Glacier Deep Archive" (atau dihapus permanen).
```

---

## 13. Scalability

Adaptasi arsitektur database mengikuti pertumbuhan CCU (Concurrent Users).

*   **1.000 Pemain (MVP)**: 
    *   Single PostgreSQL DB (RDS db.t3.medium). Redis tunggal.
*   **10.000 Pemain**: 
    *   Mengaktifkan **PgBouncer** sebagai *Connection Pooler* agar lonjakan API tidak menumpuk *connection limit* Postgres. Memisahkan 1 *Read Replica* untuk permintaan `SELECT` profil.
*   **100.000 Pemain**: 
    *   **Tabel Partisi (Partitioning)** aktif untuk tabel `Matches` dan `Ledger`. Redis beralih ke Mode *Cluster*.
*   **1.000.000 Pemain**: 
    *   **Database Sharding**: Basis data utama dipecah berdasarkan `user_id` (Misal menggunakan ekstensi Citus). Pemain Region Asia tersimpan di Shard A, Eropa di Shard B. Tabel analitik 100% dialihkan asinkron ke Data Warehouse (Redshift).

---

## 14. Backup & Recovery

1.  **WAL (Write-Ahead Logging)**: Berkas log PostgreSQL secara kontinu dialirkan ke S3 setiap 5 menit.
2.  **Point-In-Time Recovery (PITR)**: Memungkinkan pemulihan (rollback) database pada detik spesifik (misalnya tepat 1 menit sebelum peretasan/bug terjadi).
3.  **Snapshot**: Dijalankan otomatis tengah malam (Cron) untuk image basis data penuh.
4.  **Data Integrity Check**: Skrip periodik (*Reconciliation Script*) memeriksa saldo Soft Currency yang ada vs jumlah log *Double-Entry*. Jika tidak seimbang (*mismatch*), sistem membunyikan peringatan darurat ke Slack dev.

---

## 15. Security

1.  **Race Condition & Double Spend**: Operasi *Shop Purchase* atau *Crafting* wajib menggunakan klausa **`SELECT ... FOR UPDATE`**. Ini mengunci saldo dan inventory pemain khusus pada transaksi (Thread) tersebut hingga komit selesai. Tidak mungkin dua kali klik mengeksekusi dua *crafting* pada materi yang sama.
2.  **PII Encryption**: Data sensitif (jika kelak menyimpan email/fiat billing) dienkripsi menggunakan fungsi `pgcrypto` secara *At-Rest*.
3.  **Audit Logs**: Semua tabel vital (seperti *inventory*) dilengkapi *Database Triggers* yang menyalin status lama dan baru (Data Delta) ke skema `audit.logs` setiap kali terjadi *UPDATE*/*DELETE*.
4.  **Wallet Binding**: Relasi Wallet ke User sangat ketat. Pemindahan Wallet harus dicatat dan membutuhkan EIP-712 *signature* eksplisit.

---

## 16. Database Folder Organization

Struktur tata letak untuk tim DevOps/DBA.

*   `database/`
    *   `migrations/` (Berisi urutan skrip evolusi skema berseri, misal `001_init.sql`, `002_add_season.sql` untuk di- *run* oleh *Migrator Tool*).
    *   `seed/` (Skrip injeksi data awal/katalog *Shop* default untuk *environment* pengembangan).
    *   `schema/` (Definisi statis DDL tabel per modul sebagai dokumentasi *source of truth* murni).
    *   `functions/` (Definisi *Stored Procedures* atau *Triggers*, misal logika mutasi ledger).
    *   `views/` (Definisi pandangan semu gabungan, berguna untuk menyederhanakan kueri analitik ringan).
    *   `materialized_views/` (Pandangan fisik statis, sangat berguna untuk rangkuman berat yang di-*refresh* harian).
    *   `scripts/` (Kumpulan alat pemeliharaan DBA, seperti *vacuum*, reindex).

---

## 17. Decision Matrix

| Fitur Utama | Opsi 1 | Opsi 2 (Terpilih) | Alasan Keputusan |
| :--- | :--- | :--- | :--- |
| **Model Basis Data** | MongoDB (NoSQL) | **PostgreSQL (RDBMS)** | Data game dengan ekonomi dan kepemilikan sangat relasional dan menuntut ACID (Transaksi ketat, komit atau revert total). JSONB di PostgreSQL memberikan fleksibilitas setara NoSQL bila butuh metadata longgar. |
| **Peringkat Leaderboard** | Postgres (Materialized View) | **Redis (Sorted Set ZSET)** | Postgres akan kesulitan jika 100 ribu pengguna saling mengubah ELO dan langsung meminta daftar "Top 100" tiap detik. Algoritma ZSET Redis secara natural (*O(log(N))*) diciptakan untuk menyelesaikan persoalan pemeringkatan seketika (Real-time). |
| **Penyimpanan Replay Match**| Simpan Array JSON di SQL | **Simpan ke S3 Bucket (Object Storage)** | Replay vektor sangat berat dan berukuran dinamis. Basis data SQL bisa bengkak, lambat *backup*, dan menghabiskan *RAM Buffer*. Object Storage jauh lebih murah (per Gigabyte) dan dioptimasi penuh untuk penyimpanan *file statis* / biner. |
| **Sinkronisasi Blockchain**| Trigger HTTP Request ke DB | **Message Queue (RabbitMQ) ke DB** | Jika HTTP Request (*webhook*) RPC gagal direspons Backend, data transaksi hilang. Dengan Queue, pesan terjamin sampai (*At-Least-Once Delivery*). Jika DB *down*, pesan tersimpan di antrean sampai sistem hidup kembali. |
