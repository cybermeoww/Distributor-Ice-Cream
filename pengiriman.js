const firebaseConfig = {
  apiKey: "AIzaSyAEfBl_A3leDp8Kb73lI5Y51Sq_OYjLGsU",
  authDomain: "distributoreskrimsaya.firebaseapp.com",
  projectId: "distributoreskrimsaya",
  storageBucket: "distributoreskrimsaya.firebasestorage.app",
  messagingSenderId: "437181740843",
  appId: "1:437181740843:web:41890cdedddc45b903776e",
  measurementId: "G-3YJY51SZ90"
};
// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Referensi
const ordersRef = db.collection("orders");
const pengirimanRef = db.collection("pengiriman"); 
const usersRef = db.collection("users"); // <-- BUTUH AKSES KE USERS

// Elemen DOM
const logoutButton = document.getElementById('admin-logout-button');
const deliveryTableBody = document.getElementById('delivery-table-body');
const productSelect = document.getElementById('product-view-select');
const pageTitle = document.getElementById('page-title');
const tableTitle = document.getElementById('table-title');
const mapModal = document.getElementById('map-modal');
const closeMapModal = document.getElementById('close-map-modal');
const mapIframe = document.getElementById('map-iframe');
const mapSopirName = document.getElementById('map-sopir-name');
const mapKodeLacak = document.getElementById('map-kode-lacak');
const mapLastUpdate = document.getElementById('map-last-update');

// Variabel global
let productView = localStorage.getItem('currentProductView') || 'jagung';
const productId = (productView === 'jagung') ? 'jagung-001' : 'durian-002';
const docRef = db.collection("dashboard_data").doc(productView);
let currentKodeProduk = "Memuat...";
let liveListener = null; 
let sopirList = []; // <-- UNTUK MENYIMPAN DAFTAR SOPIR

// --- Keamanan Admin ---
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.email !== 'admin123@gmail.com') {
            alert("Akses ditolak."); window.location.href = 'index.html'; 
        }
    } else {
        alert("Silakan login sebagai Admin."); window.location.href = 'login.html'; 
    }
});

// --- BACA DATA PRODUK (Untuk ambil Kode & Nama) ---
docRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        currentKodeProduk = data.kodeProduk || "N/A";
        const namaProduk = data.namaProduk || "Produk";
        
        productSelect.value = productView;
        pageTitle.textContent = `Distribusi & Pengiriman (${namaProduk})`;
        tableTitle.textContent = `Daftar Pengiriman (${namaProduk})`;
    } else {
        console.log(`Dokumen '${productView}' tidak ditemukan!`);
    }
});

// --- FUNGSI BARU: AMBIL DAFTAR SOPIR ---
async function fetchSopirList() {
    sopirList = []; // Kosongkan dulu
    const querySnapshot = await usersRef.where("role", "==", "sopir").get();
    querySnapshot.forEach(doc => {
        sopirList.push({
            id: doc.id,
            nama: doc.data().nama_lengkap
        });
    });
}

// --- FUNGSI UTAMA: BACA DATA (FIXED: Filter manual) ---
function displayDeliveries() {
    ordersRef
        .orderBy("tanggal", "desc") 
        .onSnapshot(async (querySnapshot) => { 
            
            const pengirimanSnapshot = await pengirimanRef.get();
            const existingPengiriman = {};
            pengirimanSnapshot.forEach(doc => {
                existingPengiriman[doc.id] = doc.data(); 
            });

            deliveryTableBody.innerHTML = ''; 
            let dataDitemukan = false; 

            querySnapshot.forEach(doc => {
                const order = doc.data();
                const orderId = doc.id;

                if (order.status === 'Active' || order.status === 'Completed') {
                    if (order.productIds && order.productIds.includes(productId)) {
                    
                        dataDitemukan = true; 
                        const deliveryData = existingPengiriman[orderId];
                        const nomorPengiriman = `SHP-${orderId.substring(0, 8).toUpperCase()}`;
                        let statusPesananText = order.status === 'Active' ? 'Siap Kirim' : 'Selesai';
                        
                        let sopir = 'N/A';
                        let kendaraan = 'N/A';
                        let rute = 'N/A';
                        let aksiButton = `<button class="btn-info btn-input-delivery" data-order-id="${orderId}">Input Pengiriman</button>`;

                        if (deliveryData) {
                            sopir = deliveryData.sopirName; // <-- Ambil nama
                            kendaraan = deliveryData.kendaraan;
                            rute = deliveryData.rute;
                            
                            aksiButton = `
                                <button class="btn-info btn-lacak" data-id="${orderId}">Lacak</button>
                                <select class="status-select-delivery status-${deliveryData.status}" data-id="${orderId}">
                                    <option value="Pending" ${deliveryData.status === 'Pending' ? 'selected' : ''}>Menunggu Dikirim</option>
                                    <option value="Active" ${deliveryData.status === 'Active' ? 'selected' : ''}>Sedang Dikirim</option>
                                    <option value="Completed" ${deliveryData.status === 'Completed' ? 'selected' : ''}>Selesai Dikirim</option>
                                </select>
                            `;
                        }

                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${nomorPengiriman}</td>
                            <td>${order.namaCabang || order.email}</td>
                            <td><strong>${currentKodeProduk}</strong></td>
                            <td>${sopir}</td>
                            <td>${kendaraan}</td>
                            <td>${rute}</td>
                            <td><span class="status-${order.status}">${statusPesananText}</span></td>
                            <td>${aksiButton}</td>
                        `;
                        deliveryTableBody.appendChild(row);
                    }
                }
            });

            if (!dataDitemukan) {
                deliveryTableBody.innerHTML = `<tr><td colspan="8">Belum ada pesanan yang siap dikirim untuk produk ini.</td></tr>`;
            }
        });
}

// --- FUNGSI POP-UP INPUT PENGIRIMAN (LOGIKA BARU) ---
deliveryTableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-input-delivery')) {
        const orderId = e.target.getAttribute('data-order-id');

        // Buat HTML untuk dropdown sopir
        let sopirOptions = '';
        if (sopirList.length === 0) {
            sopirOptions = '<option value="">Error: Belum ada sopir terdaftar</option>';
        } else {
            sopirList.forEach(sopir => {
                sopirOptions += `<option value="${sopir.id}">${sopir.nama}</option>`;
            });
        }
        
        const { value: formValues } = await Swal.fire({
            title: 'Input Detail Pengiriman',
            html:
                '<label for="swal-sopir" style="display: block; text-align: left; margin: 10px 0 5px;">Pilih Sopir</label>' +
                `<select id="swal-sopir" class="swal2-input">${sopirOptions}</select>` +
                '<input id="swal-kendaraan" class="swal2-input" placeholder="Kendaraan (Contoh: BK 1234 MA)" required>' +
                '<input id="swal-rute" class="swal2-input" placeholder="Rute (Contoh: Gudang - Cemara Asri)" required>',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            preConfirm: () => {
                const sopirSelect = document.getElementById('swal-sopir');
                const sopirId = sopirSelect.value;
                const sopirName = sopirSelect.options[sopirSelect.selectedIndex].text;
                const kendaraan = document.getElementById('swal-kendaraan').value;
                const rute = document.getElementById('swal-rute').value;
                
                if (!sopirId || !kendaraan || !rute) {
                    Swal.showValidationMessage('Semua kolom wajib diisi');
                    return false;
                }
                return { sopirId, sopirName, kendaraan, rute };
            }
        });

        if (formValues) {
            pengirimanRef.doc(orderId).set({
                sopirId: formValues.sopirId, // <-- Simpan ID Sopir
                sopirName: formValues.sopirName, // <-- Simpan Nama Sopir
                kendaraan: formValues.kendaraan,
                rute: formValues.rute,
                status: "Pending", 
                orderId: orderId,
                tanggal: new Date(),
                latitude: null,
                longitude: null
            })
            .then(() => {
                Swal.fire('Sukses!', 'Pengiriman telah ditugaskan ke sopir.', 'success');
            })
            .catch(e => Swal.fire('Error', e.message, 'error'));
        }
    }
    
    // FUNGSI TOMBOL LACAK DIKLIK
    if (e.target.classList.contains('btn-lacak')) {
        const orderId = e.target.getAttribute('data-id');
        const docToListen = pengirimanRef.doc(orderId);
        
        if (liveListener) liveListener(); 
        
        liveListener = docToListen.onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                
                mapSopirName.textContent = data.sopirName;
                mapKodeLacak.textContent = "Pelacakan Aktif"; // Kode lacak tidak diperlukan lagi
                
                if (data.latitude && data.longitude) {
                    mapIframe.src = `https://maps.google.com/maps?q=${data.latitude},${data.longitude}&z=15&output=embed`;
                    mapLastUpdate.textContent = `Lokasi diperbarui: ${new Date(data.lastUpdate.seconds * 1000).toLocaleTimeString()}`;
                } else {
                    mapIframe.src = `https://maps.google.com/maps?q=${data.rute}&z=12&output=embed`;
                    mapLastUpdate.textContent = "Menunggu sopir memulai pelacakan...";
                }
                mapModal.style.display = 'block';
            }
        });
    }
});

// --- FUNGSI UPDATE STATUS PENGIRIMAN (Dropdown) ---
deliveryTableBody.addEventListener('change', (e) => {
    // ... (kode 'change' Anda tetap sama persis)
});

// --- EVENT LISTENER MODAL & DROPDOWN ---
closeMapModal.addEventListener('click', () => {
    mapModal.style.display = 'none';
    if (liveListener) liveListener(); 
});
productSelect.addEventListener('change', (e) => {
    localStorage.setItem('currentProductView', e.target.value);
    window.location.reload();
});

// --- INITIAL LOAD & LOGOUT ---
document.addEventListener('DOMContentLoaded', () => {
    fetchSopirList(); // Ambil daftar sopir dulu
    displayDeliveries(); // Baru tampilkan tabel
});

logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});

// --- BLOK KODE PROTEKSI MENU (TAMBAHKAN INI DI AKHIR SETIAP FILE JS ADMIN) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Daftar Password (Bisa Anda ubah di sini)
    const passwords = {
        pesanan: "PESAN123",
        produk: "PROD123",
        stok: "STOK123",
        cabang: "CAB123",
        pengiriman: "KIRIM123"
    };

    // 2. Fungsi Pop-up
    async function showPasswordPopup(menuName, correctPassword, targetUrl) {
        // Cek apakah kita sudah di halaman tujuan
        if (window.location.pathname.endsWith(targetUrl)) {
            return; // Jika sudah, jangan tanya password
        }

        const { value: password } = await Swal.fire({
            title: `Akses Terbatas`,
            text: `Masukkan password untuk membuka ${menuName}:`,
            input: 'password',
            inputPlaceholder: 'Masukkan password...',
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Buka',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            preConfirm: (pass) => {
                if (pass === correctPassword) {
                    return true;
                } else {
                    Swal.showValidationMessage(`Password salah!`);
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });

        if (password) {
            // Jika password benar, arahkan ke halaman
            window.location.href = targetUrl;
        }
    }

    // 3. Pasang Listener ke Semua Tombol Menu yang Dilindungi
    const menuPesanan = document.getElementById('menu-pesanan');
    if (menuPesanan) {
        menuPesanan.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordPopup('Manajemen Pesanan', passwords.pesanan, 'pesanan.html');
        });
    }

    const menuProduk = document.getElementById('menu-produk');
    if (menuProduk) {
        menuProduk.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordPopup('Manajemen Produk', passwords.produk, 'produk.html');
        });
    }

    const menuStok = document.getElementById('menu-stok');
    if (menuStok) {
        menuStok.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordPopup('Manajemen Stok', passwords.stok, 'stok.html');
        });
    }
    
    const menuCabang = document.getElementById('menu-cabang');
    if (menuCabang) {
        menuCabang.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordPopup('Manajemen Cabang', passwords.cabang, 'cabang.html');
        });
    }
    
    const menuPengiriman = document.getElementById('menu-pengiriman');
    if (menuPengiriman) {
        menuPengiriman.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordPopup('Manajemen Pengiriman', passwords.pengiriman, 'pengiriman.html');
        });
    }
});
// --- AKHIR BLOK KODE PROTEKSI ---