# Smart Contract Software Design Specification (SDS): GameFi Archery Web3

---

## 1. Smart Contract Overview

Ekosistem *Smart Contract* dirancang dengan arsitektur modular (*Hub and Spoke*). Pemisahan logika bisnis dari penyimpanan data aset memungkinkan pemeliharaan yang lebih mudah dan peningkatan keamanan.

```text
       [Emergency Admin]          [Backend Server]
              |                           | (EIP-712 Signature)
              v                           v
+-----------------------------+   +---------------+
|        Role Manager         |   |    Player     |
| (RBAC & Emergency Pause)    |   |   (Wallet)    |
+-----------------------------+   +---------------+
        |             |                   |
        v             v                   |
  (Grants)      (Configures)              | (Purchases / Claims)
        |             |                   v
        |     +-------+-------+   +---------------+
        |     |   Treasury    |<--| Shop Contract |
        |     | (Vault/Split) |   | (E-Commerce)  |
        |     +-------+-------+   +---------------+
        |             |                   |
        |             |                   | (Triggers Mint)
        |             v                   v
        |    +----------------+   +---------------+
        +--->| SBTAchievement |   | ERC1155 Items |
        |    |  (ERC-5192)    |   | (Cosmetics)   |
        |    +----------------+   +---------------+
        |             |                   |
        |             v                   v
        +--->+------------------------------------+
             |         Web3 Indexer Worker        |
             |       (Reads State & Events)       |
             +------------------------------------+
```

---

## 2. Contract Catalog

Berikut adalah entitas kontrak utama yang akan dikembangkan:

### A. RoleManager
*   **Purpose**: Menjadi pusat otoritas tunggal (Single Source of Authority) untuk seluruh sistem Role-Based Access Control (RBAC).
*   **Responsibilities**: Menyimpan penetapan *role*, fungsi *Pause/Unpause* darurat global, dan pencabutan hak akses.
*   **Dependencies**: Digunakan oleh semua kontrak lain via Modifier.
*   **Public Visibility**: Publik (untuk membaca *role*).
*   **Interaction**: Admin menetapkan *role* Shop Contract agar boleh melakukan *Mint* di ERC1155.

### B. ShopContract
*   **Purpose**: Etalase utama untuk pemain berinteraksi dengan ekonomi kripto.
*   **Responsibilities**: Memvalidasi harga barang, menerima pembayaran, mengirim dana ke Treasury, dan memanggil fungsi `mint` pada kontrak NFT.
*   **Dependencies**: Membutuhkan alamat Treasury dan kontrak ERC1155/721.
*   **Public Visibility**: Terbuka untuk umum (*Payable*).

### C. ERC1155Cosmetic
*   **Purpose**: Representasi kepemilikan aset kosmetik *semi-fungible* (seperti efek partikel atau anak panah standar berbayar).
*   **Responsibilities**: Standar transfer ERC1155, *Batch Mint*, *Batch Burn*, dan *URI Metadata*.
*   **Dependencies**: RoleManager.

### D. ERC721Premium (Opsional jika ada item 1/1)
*   **Purpose**: Representasi kepemilikan unik (Skin Legendaris 1-of-1).
*   **Responsibilities**: Standar transfer ERC721.

### E. SBTAchievement
*   **Purpose**: Medali permanen (Soulbound) yang membuktikan rekam jejak pemain.
*   **Responsibilities**: *Minting* dengan verifikasi EIP-712 Signature, menolak setiap upaya `transfer` atau `approve`.
*   **Dependencies**: RoleManager.

### F. Treasury
*   **Purpose**: Brankas penampungan dana.
*   **Responsibilities**: Menerima koin *Native* (ETH/MATIC) atau ERC20 dari Shop, dan mendistribusikannya sesuai *Revenue Split* (misal 80% ke Dev, 20% ke Prize Pool).

---

## 3. Responsibility Matrix

| Tanggung Jawab | Contract Bertanggung Jawab | Catatan Tambahan |
| :--- | :--- | :--- |
| **Mint** | ERC1155, ERC721, SBT | Hanya boleh dipanggil oleh entitas dengan *MINTER_ROLE*. |
| **Burn** | ERC1155, ERC721 | Boleh dipanggil oleh Pemilik atau *BURNER_ROLE* (untuk mekanik *Crafting*). |
| **Transfer** | ERC1155, ERC721 | Ditolak keras pada kontrak SBT. |
| **Purchase** | ShopContract | Memvalidasi SKU, Harga, dan Supply sebelum pembayaran. |
| **Claim (Achievement)**| SBTAchievement | Memvalidasi EIP-712 Signature dari Backend. |
| **Treasury & Split** | Treasury | Menampung nilai moneter. |
| **Metadata URI** | ERC1155, ERC721, SBT | Menyimpan BaseURI yang mengarah ke API Backend atau IPFS. |
| **Emergency Pause** | RoleManager | Menghentikan fungsi *Mint/Buy* saat terjadi peretasan. |
| **Royalty (EIP-2981)** | ERC1155, ERC721 | Mengarahkan penerima royalti ke alamat Treasury. |

---

## 4. Interface Specification (Contoh Terpilih)

### ShopContract
| Function Type | Name | Inputs | Outputs | Expected Behaviour |
| :--- | :--- | :--- | :--- | :--- |
| **External** (Payable) | `buyItem` | `uint256 skuId`, `uint256 quantity` | None | Memeriksa apakah `msg.value` sesuai `price * qty`. Memanggil `Treasury.deposit`. Memanggil `ERC1155.mint`. |
| **Admin** | `updateItem` | `uint256 skuId`, `uint256 price`, `uint256 maxSupply` | None | Menambahkan atau memperbarui katalog harga item. |
| **View** | `getItemInfo` | `uint256 skuId` | `price`, `supply` | Mengembalikan detail produk. |
| **Events** | `ItemPurchased` | `buyer` (indexed), `skuId` (indexed), `qty`, `price` | None | Ditembakkan setelah sukses beli, ditangkap oleh Indexer. |
| **Errors** | `InsufficientFunds` | `required`, `provided` | None | Revert jika uang kurang. |
| **Errors** | `SupplyExceeded` | `requested`, `remaining` | None | Revert jika item habis. |

### SBTAchievement
| Function Type | Name | Inputs | Outputs | Expected Behaviour |
| :--- | :--- | :--- | :--- | :--- |
| **External** | `claimAchievement` | `uint256 achievementId`, `uint256 nonce`, `bytes signature` | None | Melakukan *ecrecover*. Jika sukses, *mint* SBT ke pemanggil. Tandai *nonce* telah digunakan. |
| **View** | `hasClaimed` | `address user`, `uint256 achievementId` | `bool` | Memeriksa kepemilikan. |
| **Errors** | `InvalidSignature` | None | None | Revert jika *signer* bukan dompet Backend. |
| **Errors** | `SoulboundToken` | None | None | Revert saat fungsi transfer apapun dipanggil. |

---

## 5. State Management

Desain penyimpanan (*Storage*) dioptimasi untuk menghemat ongkos *gas*.

*   **Immutable Data**: Variabel yang di-set saat konstruktor dan tidak pernah berubah (misalnya alamat dompet *RoleManager* di dalam kontrak lain, nama dan simbol koleksi NFT) menggunakan kata kunci `immutable` untuk menghemat gas pembacaan (`SLOAD`).
*   **Mutable Data**: Data konfigurasi harga di ShopContract, *Nonce mapping* di SBTAchievement, dan suplai saat ini (Current Supply) dari tiap item.
*   **Mapping**: 
    *   `mapping(address => mapping(uint256 => bool)) public usedNonces;` (Melacak *claim* SBT).
    *   `mapping(uint256 => ItemConfig) public shopCatalog;` (Katalog SKU toko).
*   **Storage Layout**: Tidak menggunakan skema proksi kompleks seperti *Diamond Pattern* (EIP-2535) untuk MVP, melainkan penyimpanan sekuensial standar. 

---

## 6. Access Control

Diimplementasikan menggunakan standar setara `AccessControl` OpenZeppelin.

*   **DEFAULT_ADMIN_ROLE (Owner/Multisig)**: Memiliki hak absolut mencabut dan menambahkan peran lain.
*   **MINTER_ROLE**: Diberikan kepada `ShopContract`. Mengizinkan pencetakan (*minting*) token baru di kontrak NFT.
*   **BURNER_ROLE**: Diberikan kepada fitur *Crafting* (jika dipisahkan dari Shop).
*   **PAUSER_ROLE (Emergency Admin)**: Diberikan ke dompet operasional developer untuk menekan "Tombol Darurat" (mengunci transaksi ekonomi) tanpa butuh persetujuan lambat dari Multi-Sig.
*   **SIGNER_ROLE**: Hanya berupa verifikasi *state*, yaitu alamat publik dari Private Key mesin backend yang menandatangani *payload* EIP-712.
*   **Restriction**: Player biasa tidak memiliki *role*, hanya dapat memanggil fungsi-fungsi publik/transaksional.

---

## 7. NFT Architecture

*   **Standar Utama**: **ERC1155** dipilih sebagai tulang punggung karena efisiensi gas-nya dalam menangani *Batch Minting* dan kepemilikan kuantitas ganda (misal pemain butuh 5 "Efek Angin").
*   **Marketplace Compatibility**: Mengimplementasikan antarmuka `IERC2981` (NFT Royalty Standard). Mendukung fungsi standar yang dibutuhkan oleh OpenSea/Blur/MagicEden.
*   **Equip Flow (Gasless)**: Sama sekali **TIDAK** ada fungsi `equip()` di dalam *smart contract*. Jika `equip()` diletakkan on-chain, pemain harus membayar gas tiap kali ganti kostum. Status pemakaian murni di- *handle* secara off-chain di database, dengan syarat Backend memverifikasi `balanceOf(user) > 0` di Blockchain.
*   **Item Supply**:
    *   *Limited Supply*: Dikendalikan oleh variabel di ShopContract (`currentSupply < maxSupply`).

---

## 8. Soulbound Architecture

*   **Pendekatan**: Memodifikasi kontrak dasar ERC-721 dengan melakukan *override* (*menimpa*) fungsi `transferFrom` dan `safeTransferFrom` agar selalu melakukan `revert CustomError()`. (Standar EIP-5192).
*   **EIP-712 Signature**: 
    *   Domain Separator: `name = "ArcheryGame", version = "1", chainId = X, verifyingContract = SBTAchievementAddress`.
    *   Payload: `hashStruct(AchievementType, WalletAddress, Nonce)`.
*   **Replay Protection**: Membutuhkan `Nonce`. Setiap dokumen EIP-712 yang ditandatangani oleh backend memiliki *Nonce* unik. Saat diklaim, kontrak mencatat *Nonce* tersebut `usedNonces[nonce] = true`.

---

## 9. Shop Architecture (Transaction Flow)

1.  **Player**: Membuka antarmuka UI.
2.  **Wallet**: Menyetujui transaksi `buyItem(sku: 101, qty: 1)`.
3.  **Shop Contract**: Mengecek apakah SKU 101 aktif. Mengecek kecukupan suplai.
4.  **Treasury**: Shop Contract meneruskan `msg.value` (ETH/MATIC) ke Treasury.
5.  **Mint**: Shop Contract memanggil `ERC1155.mint(buyer, 101, 1, "")`.
6.  **Event**: ERC1155 melepaskan event `TransferSingle`. Shop melepaskan event `ItemPurchased`.
7.  **Indexer Worker**: Membaca event `ItemPurchased` dari JSON-RPC setelah finalisasi blok.
8.  **Database**: Indexer memperbarui saldo persediaan pengguna di tabel PostgreSQL.
9.  **Inventory UI**: Notifikasi muncul, item siap dipakai (Equip).

---

## 10. Treasury Design

*   **Tujuan**: Mengisolasi risiko dana terkumpul dari celah bisnis di dalam ShopContract. Jika Shop diretas secara logika (bug diskon, dll), dana yang sudah masuk Treasury tetap aman.
*   **Multi Signature**: Kontrak Treasury dimiliki (*owned*) oleh *Gnosis Safe* (Multi-Sig Wallet) direksi/pengembang inti (misal butuh persetujuan 3 dari 5 kunci).
*   **Withdrawal**: Fungsi `withdraw()` murni ditujukan ke alamat Multi-Sig.
*   **Supported Token**: Untuk MVP, menggunakan koin *Native* (ETH/MATIC/BNB) agar pemain tidak perlu melakukan dua kali transaksi (satu untuk `approve` ERC20, satu untuk `buy`). Penggunaan ERC20 untuk pembayaran dapat ditambahkan nanti.

---

## 11. Event Architecture

*Event* adalah jembatan vital antara Web3 dan Web2 Backend.

| Event Name | Publisher | Payload (Indexed args ditandai `*`) | Purpose / Indexer Usage |
| :--- | :--- | :--- | :--- |
| `ItemPurchased` | Shop | `address* buyer`, `uint256* sku`, `uint qty`, `uint price` | Menyinkronkan database bahwa pembelian sah telah terjadi. |
| `SBTMinted` | SBT Contract | `address* user`, `uint256* achievementId` | Memvalidasi ke backend bahwa lencana berhasil tercetak. |
| `RoleGranted` | RoleManager | `bytes32* role`, `address* account`, `address* sender` | Sistem peringatan dini keamanan ke Slack DevOps jika admin berubah. |
| `TreasuryDeposit`| Treasury | `address* sender`, `uint256 amount` | Pencatatan arus kas analitik. |
| `Paused` | RoleManager | `address account` | Backend menghentikan API yang terkait blockchain. |

---

## 12. Metadata Design

*   **Pendekatan Base URI**: Menggunakan API terpusat untuk MVP (misal: `https://api.archerydapp.com/metadata/{id}`) karena sifatnya dinamis, namun data gambarnya disimpan di CDN.
*   **Future Compatibility**: Base URI di kontrak dibuat dapat diubah (*mutable*) oleh Admin. Ketika fitur sudah final atau permainan diubah murni desentralisasi, BaseURI dapat diganti ke `ipfs://<CID>/` dan dikunci (Frozen).
*   **Struktur Standar (JSON)**:
    ```json
    {
      "name": "Fire Bow Epic",
      "description": "Busur api mematikan dengan efek bakar.",
      "image": "https://cdn.../images/fire_bow.png",
      "animation_url": "https://cdn.../models/fire_bow.glb",
      "attributes": [
        { "trait_type": "Rarity", "value": "Epic" },
        { "trait_type": "Category", "value": "Bow" }
      ]
    }
    ```

---

## 13. Security Review

Mitigasi kerentanan spesifik di tingkat *smart contract*:

*   **Signature Replay Attack**: Dimitigasi dengan `Nonce` unik per pemain dan pencantuman `chainId` di *Domain Separator* EIP-712 agar tanda tangan tidak bisa di-*replay* di jaringan *testnet/fork*.
*   **Reentrancy**: Fungsi pembelian dan penarikan kas dilindungi dengan *modifier* `nonReentrant` dari OpenZeppelin, atau menerapkan pola CEI (Checks-Effects-Interactions) secara ketat.
*   **Unauthorized Mint/Burn**: Secara eksplisit diperiksa dengan `require(hasRole(MINTER_ROLE, msg.sender))`.
*   **Front Running**: Tidak berdampak besar pada GameFi kosmetik yang harganya statis (tidak seperti DEX AMM). Jika suplai habis, transaksi front-runner akan sukses, dan transaksi korban akan me- *revert* secara natural (*SupplyExceeded*).
*   **Integer Overflow**: Secara otomatis dicegah oleh *compiler* Solidity ^0.8.0+.
*   **Compromised Admin**: Hak admin disebarkan menggunakan pola dompet Multi-Sig, sehingga satu kunci privat developer yang bocor tidak dapat menghancurkan kontrak.

---

## 14. Upgrade Strategy

*   **Keputusan Final untuk MVP: IMMUTABLE CONTRACTS (Non-Upgradeable)**.
*   **Alasan Keputusan (Kelebihan)**: 
    *   Lebih murah secara drastis untuk *gas deployment*.
    *   Lebih terpercaya di mata komunitas (kode tidak dapat diam-diam diubah developer).
    *   Jauh lebih aman dari celah *Storage Collision* yang sering menghancurkan proyek proksi.
*   **Kekurangan**: Jika ada *bug* logika bisnis, kontrak harus di-*deploy* ulang.
*   **Strategi Mitigasi (Hub and Spoke)**: Karena arsitekturnya modular, jika *ShopContract* memiliki bug, kita hanya mendeploy `ShopContractV2`. Kemudian, `RoleManager` mencabut hak cetak (Minter Role) dari Shop lama, dan memberikannya ke Shop baru. Kontrak NFT-nya sendiri tetap abadi (Immutable), sehingga saldo pengguna 100% aman dan tidak terganggu.

---

## 15. Deployment Strategy

Langkah-langkah yang akan dieksekusi oleh skrip *Deployment* (Hardhat/Foundry):

1.  **Deployment Order**:
    *   *Deploy* `RoleManager`.
    *   *Deploy* `Treasury` (Memberikan alamat Multisig).
    *   *Deploy* `ERC1155Cosmetic` (Menginjeksi alamat `RoleManager`).
    *   *Deploy* `SBTAchievement` (Menginjeksi alamat `RoleManager`).
    *   *Deploy* `ShopContract` (Menginjeksi `RoleManager`, `Treasury`, `ERC1155`).
2.  **Role Assignment**:
    *   Skrip mengatur `MINTER_ROLE` pada `ERC1155` ke alamat `ShopContract`.
    *   Skrip mengatur `SIGNER_ROLE` pada `SBTAchievement` ke *public key* milik server Backend.
3.  **Initialization**:
    *   Mengunggah konfigurasi awal SKU harga ke `ShopContract`.
4.  **Ownership Transfer**:
    *   Menyerahkan kunci `DEFAULT_ADMIN_ROLE` dari akun *Deployer* (Developer) ke dompet *Multi-Sig Gnosis Safe*.
    *   Pencabutan akses Admin dari akun *Deployer*.

---

## 16. Decision Matrix

| Keputusan Arsitektural | Opsi Dipertimbangkan | Solusi Terpilih | Alasan Memilih |
| :--- | :--- | :--- | :--- |
| **Standar NFT Kosmetik** | ERC721 vs ERC1155 | **ERC1155** | Memungkinkan satu pemain memiliki 10 buah *Consumable* tanpa perlu mencetak 10 token berbeda. Jauh lebih hemat gas (Batch Transfer) dan rapi dalam mengelola stok (*fungibility*). |
| **Polisi Upgradeable** | Transparent Proxy vs Immutable | **Immutable (Modular)** | Kredibilitas keamanan. Proksi menambah overhead per transaksi. Logika yang bisa kadaluarsa (seperti Shop) diakali dengan men-*deploy* kontrak baru lalu merotasi *Minter Role*. |
| **Mata Uang Pembayaran** | Native (ETH/BNB) vs ERC20 Token | **Native Token** | Gesekan pengguna (*UX Friction*) sangat rendah. Jika memakai ERC20, pemain harus 1) Beli Koin, 2) Approve Koin (bayar gas), 3) Checkout (bayar gas). Dengan koin bawaan jaringan, cukup 1 klik (Checkout). |
| **Model Role** | `Ownable` (Satu Owner) vs `AccessControl` | **AccessControl** | *Ownable* terlalu tersentralisasi (satu dompet pemegang hak mutlak). *AccessControl* memungkinkan pembagian tugas spesifik (contoh: Dompet A hanya boleh mencetak, Dompet B hanya boleh mem- *pause*). |
| **Verifikasi Pencapaian** | Server memanggil *Mint* vs EIP-712 Signature | **EIP-712 Signature** | Developer tidak menanggung biaya jaringan pemain (Gas). Terbebas dari vektor serangan manipulasi (menguras dompet gas dev). |
