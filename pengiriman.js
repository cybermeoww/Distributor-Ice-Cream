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
let liveListener = null; // Untuk menyimpan listener live location

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
                            sopir = deliveryData.sopir;
                            kendaraan = deliveryData.kendaraan;
                            rute = deliveryData.rute;
                            
                            // Tambah tombol Lacak + Dropdown Status
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

// --- FUNGSI POP-UP INPUT PENGIRIMAN ---
deliveryTableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-input-delivery')) {
        const orderId = e.target.getAttribute('data-order-id');

        const { value: formValues } = await Swal.fire({
            title: 'Input Detail Pengiriman',
            html:
                '<input id="swal-sopir" class="swal2-input" placeholder="Nama Sopir" required>' +
                '<input id="swal-kendaraan" class="swal2-input" placeholder="Kendaraan (Contoh: BK 1234 MA)" required>' +
                '<input id="swal-rute" class="swal2-input" placeholder="Rute (Contoh: Gudang - Cemara Asri)" required>',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            preConfirm: () => {
                const sopir = document.getElementById('swal-sopir').value;
                const kendaraan = document.getElementById('swal-kendaraan').value;
                const rute = document.getElementById('swal-rute').value;
                if (!sopir || !kendaraan || !rute) {
                    Swal.showValidationMessage('Semua kolom wajib diisi');
                    return false;
                }
                return { sopir, kendaraan, rute };
            }
        });

        if (formValues) {
            // Buat Kode Lacak unik (6 digit acak)
            const kodeLacak = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            pengirimanRef.doc(orderId).set({
                sopir: formValues.sopir,
                kendaraan: formValues.kendaraan,
                rute: formValues.rute,
                status: "Pending", 
                orderId: orderId,
                tanggal: new Date(),
                kodeLacak: kodeLacak, // <-- SIMPAN KODE LACAK
                latitude: null,
                longitude: null
            })
            .then(() => {
                Swal.fire('Sukses!', `Pengiriman diinput. Kode Lacak: ${kodeLacak}`, 'success');
            })
            .catch(e => Swal.fire('Error', e.message, 'error'));
        }
    }
    
    // FUNGSI BARU: TOMBOL LACAK DIKLIK
    if (e.target.classList.contains('btn-lacak')) {
        const orderId = e.target.getAttribute('data-id');
        const docToListen = pengirimanRef.doc(orderId);
        
        // Hentikan listener lama (jika ada)
        if (liveListener) liveListener(); 
        
        // Mulai listener baru
        liveListener = docToListen.onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                
                // Set info modal
                mapSopirName.textContent = data.sopir;
                mapKodeLacak.textContent = data.kodeLacak;
                
                if (data.latitude && data.longitude) {
                    // Ada lokasi! Tampilkan di peta
                    const lat = data.latitude;
                    const lng = data.longitude;
                    mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${lat},${lng}&zoom=15`;
                    // Ganti YOUR_API_KEY dengan API Key Google Maps Embed Anda
                    // (Bisa juga pakai q=${data.rute} jika tidak punya API Key)
                    // Mari kita pakai yang gratis (berbasis rute, bukan live GPS)
                    mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${data.latitude},${data.longitude}`;
                    
                    // SOLUSI GRATIS (Tanpa Live Marker, tapi tetap update)
                    mapIframe.src = `https://maps.google.com/maps?q=${data.latitude},${data.longitude}&z=15&output=embed`;

                    mapLastUpdate.textContent = `Lokasi diperbarui: ${new Date(data.lastUpdate.seconds * 1000).toLocaleTimeString()}`;
                } else {
                    // Belum ada lokasi, tampilkan rute
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
    // Hentikan listener saat modal ditutup
    if (liveListener) liveListener(); 
});
productSelect.addEventListener('change', (e) => {
    localStorage.setItem('currentProductView', e.target.value);
    window.location.reload();
});

// --- INITIAL LOAD & LOGOUT ---
document.addEventListener('DOMContentLoaded', displayDeliveries);
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});