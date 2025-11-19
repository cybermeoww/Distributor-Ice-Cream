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
const usersRef = db.collection("users");

// Elemen DOM
const logoutButton = document.getElementById('admin-logout-button');
const deliveryTableBody = document.getElementById('delivery-table-body');
const productSelect = document.getElementById('product-view-select');
const pageTitle = document.getElementById('page-title');
const tableTitle = document.getElementById('table-title');

// DOM Modal Peta
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
let sopirList = []; 

// --- Keamanan Admin ---
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.email !== 'admin123@gmail.com' && user.email !== 'superadmin@gmail.com') {
            alert("Akses ditolak."); window.location.href = 'index.html'; 
        }
    } else {
        alert("Silakan login sebagai Admin."); window.location.href = 'login.html'; 
    }
});

// --- BACA DATA PRODUK (Untuk Judul & Kode) ---
docRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        currentKodeProduk = data.kodeProduk || "N/A";
        const namaProduk = data.namaProduk || "Produk";
        
        if(productSelect) productSelect.value = productView;
        if(pageTitle) pageTitle.textContent = `Distribusi & Pengiriman (${namaProduk})`;
        if(tableTitle) tableTitle.textContent = `Daftar Pengiriman (${namaProduk})`;
    }
});

// --- AMBIL DAFTAR SOPIR ---
async function fetchSopirList() {
    sopirList = []; 
    const querySnapshot = await usersRef.where("role", "==", "sopir").get();
    querySnapshot.forEach(doc => {
        sopirList.push({
            id: doc.id,
            nama: doc.data().nama_lengkap
        });
    });
}

// --- FUNGSI UTAMA: BACA DATA TABEL ---
function displayDeliveries() {
    ordersRef
        .orderBy("tanggal", "desc") 
        .onSnapshot(async (querySnapshot) => { 
            
            // Ambil data pengiriman terbaru setiap kali ada perubahan
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

                // Filter: Hanya status Active/Completed DAN Produk yang sesuai
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
                            sopir = deliveryData.sopirName || deliveryData.sopir; // Support format lama/baru
                            kendaraan = deliveryData.kendaraan;
                            rute = deliveryData.rute;
                            
                            // Dropdown Status + Tombol Lacak
                            aksiButton = `
                                <button class="btn-info btn-lacak" data-id="${orderId}" style="margin-right:5px;">Lacak</button>
                                <select class="status-select-delivery" data-id="${orderId}" style="padding: 5px;">
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

// --- FUNGSI UPDATE STATUS PENGIRIMAN (FIXED: AUTO REFRESH) ---
deliveryTableBody.addEventListener('change', async (e) => {
    if (e.target.classList.contains('status-select-delivery')) {
        const newStatus = e.target.value;
        const id = e.target.getAttribute('data-id'); 

        try {
            // 1. Update status di tabel 'pengiriman'
            await pengirimanRef.doc(id).update({ status: newStatus });

            // 2. Update status di tabel 'orders' (Sinkronisasi)
            if (newStatus === 'Completed') {
                await ordersRef.doc(id).update({ status: 'Completed' });
            } else {
                await ordersRef.doc(id).update({ status: 'Active' });
            }

            // 3. Notifikasi Sukses
            await Swal.fire({
                title: 'Status Diperbarui!',
                text: 'Data tersimpan. Halaman akan dimuat ulang.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            // 4. REFRESH HALAMAN (Solusi agar status tidak "mental" balik)
            window.location.reload();

        } catch (error) {
            Swal.fire('Error', error.message, 'error');
            setTimeout(() => window.location.reload(), 1000);
        }
    }
});

// --- FUNGSI POP-UP INPUT PENGIRIMAN (PILIH SOPIR) ---
deliveryTableBody.addEventListener('click', async (e) => {
    // INPUT PENGIRIMAN
    if (e.target.classList.contains('btn-input-delivery')) {
        const orderId = e.target.getAttribute('data-order-id');

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
                sopirId: formValues.sopirId,
                sopirName: formValues.sopirName,
                kendaraan: formValues.kendaraan,
                rute: formValues.rute,
                status: "Pending", 
                orderId: orderId,
                tanggal: new Date(),
                latitude: null,
                longitude: null
            })
            .then(async () => {
                await Swal.fire('Sukses!', 'Pengiriman telah ditugaskan.', 'success');
                window.location.reload(); // Refresh agar tombol berubah
            })
            .catch(e => Swal.fire('Error', e.message, 'error'));
        }
    }
    
    // TOMBOL LACAK (LIVE MAPS)
    if (e.target.classList.contains('btn-lacak')) {
        const orderId = e.target.getAttribute('data-id');
        const docToListen = pengirimanRef.doc(orderId);
        
        if (liveListener) liveListener(); 
        
        liveListener = docToListen.onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                mapSopirName.textContent = data.sopirName;
                mapKodeLacak.textContent = "Pelacakan Aktif";
                
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

// --- EVENT LISTENER UMUM ---
if (closeMapModal) {
    closeMapModal.addEventListener('click', () => {
        mapModal.style.display = 'none';
        if (liveListener) liveListener(); 
    });
}
if (productSelect) {
    productSelect.addEventListener('change', (e) => {
        localStorage.setItem('currentProductView', e.target.value);
        window.location.reload();
    });
}

// --- INITIAL LOAD & LOGOUT ---
document.addEventListener('DOMContentLoaded', () => {
    fetchSopirList(); 
    displayDeliveries(); 
});
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});

// --- BLOK KODE PROTEKSI MENU (FINAL - DENGAN DASHBOARD) ---
document.addEventListener('DOMContentLoaded', () => {
    // Tunggu firebase auth siap
    firebase.auth().onAuthStateChanged(user => {
        if (!user) return; // Jika tidak ada user, hentikan
        
        const currentUserEmail = user.email;

        // 1. Fungsi Pop-up (Dengan Ikon Mata)
        async function showPasswordPopup(menuTitle, menuFieldName, targetUrl) {
            // Cek apakah sudah di halaman tujuan
            if (window.location.pathname.endsWith(targetUrl)) {
                return; 
            }
            
            // --- LOGIKA BYPASS SUPER ADMIN ---
            if (currentUserEmail === 'superadmin@gmail.com') {
                window.location.href = targetUrl; // Langsung pindah
                return; 
            }

            // Ambil password dari Firestore
            let correctPassword;
            try {
                const doc = await db.collection("dashboard_data").doc("menu_passwords").get();
                if (!doc.exists) {
                    Swal.fire('Error', 'Dokumen password tidak ditemukan!', 'error');
                    return;
                }
                correctPassword = doc.data()[menuFieldName];
            } catch (e) {
                Swal.fire('Error DB', e.message, 'error');
                return;
            }

            // Tampilkan pop-up
            const { value: password } = await Swal.fire({
                title: `Akses Terbatas`,
                text: `Masukkan password untuk membuka ${menuTitle}:`,
                html: `
                    <div style="position: relative;">
                        <input type="password" id="swal-password-input" class="swal2-input" placeholder="Masukkan password..." style="padding-right: 45px;">
                        <span id="swal-toggle-password" style="position: absolute; right: 25px; top: 50%; transform: translateY(-50%); cursor: pointer; z-index: 10; color: #555;">
                            <i class="fas fa-eye" id="swal-eye-icon"></i>
                        </span>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Buka',
                cancelButtonText: 'Batal',
                allowOutsideClick: false,
                didOpen: () => {
                    const passwordInput = document.getElementById('swal-password-input');
                    const toggleButton = document.getElementById('swal-toggle-password');
                    const eyeIcon = document.getElementById('swal-eye-icon');
                    toggleButton.addEventListener('click', () => {
                        if (passwordInput.type === 'password') {
                            passwordInput.type = 'text';
                            eyeIcon.classList.remove('fa-eye');
                            eyeIcon.classList.add('fa-eye-slash');
                        } else {
                            passwordInput.type = 'password';
                            eyeIcon.classList.remove('fa-eye-slash');
                            eyeIcon.classList.add('fa-eye');
                        }
                    });
                    passwordInput.focus();
                },
                preConfirm: () => {
                    const pass = document.getElementById('swal-password-input').value;
                    if (pass === correctPassword) {
                        return true;
                    } else {
                        Swal.showValidationMessage(`Password salah!`);
                        return false;
                    }
                }
            });

            if (password) {
                window.location.href = targetUrl;
            }
        }

        // 3. Pasang Listener ke Semua 6 Tombol Menu yang Dilindungi
        
        // --- TAMBAHKAN LISTENER DASHBOARD INI ---
        const menuDashboard = document.getElementById('menu-dashboard');
        if (menuDashboard) {
            menuDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Dashboard', 'dashboard', 'admin-dashboard.html');
            });
        }
        
        const menuPesanan = document.getElementById('menu-pesanan');
        if (menuPesanan) {
            menuPesanan.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Manajemen Pesanan', 'pesanan', 'pesanan.html');
            });
        }

        const menuProduk = document.getElementById('menu-produk');
        if (menuProduk) {
            menuProduk.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Manajemen Produk', 'produk', 'produk.html');
            });
        }

        const menuStok = document.getElementById('menu-stok');
        if (menuStok) {
            menuStok.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Manajemen Stok', 'stok', 'stok.html');
            });
        }
        
        const menuCabang = document.getElementById('menu-cabang');
        if (menuCabang) {
            menuCabang.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Manajemen Cabang', 'cabang', 'cabang.html');
            });
        }
        
        const menuPengiriman = document.getElementById('menu-pengiriman');
        if (menuPengiriman) {
            menuPengiriman.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Manajemen Pengiriman', 'pengiriman', 'pengiriman.html');
            });
        }
    }); // Tutup onAuthStateChanged
});
// --- AKHIR BLOK KODE PROTEKSI ---