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

// =============================================
// LOGIKA BARU: PEMILIH PRODUK (PRODUCT SELECTOR)
// =============================================
let productView = localStorage.getItem('currentProductView') || 'jagung';
const productId = (productView === 'jagung') ? 'jagung-001' : 'durian-002';
const docRef = db.collection("dashboard_data").doc(productView);
const ordersRef = db.collection("orders");
const pengirimanRef = db.collection("pengiriman"); 

// Elemen DOM
const logoutButton = document.getElementById('admin-logout-button');
const deliveryTableBody = document.getElementById('delivery-table-body');
const productSelect = document.getElementById('product-view-select');
const pageTitle = document.getElementById('page-title');
const tableTitle = document.getElementById('table-title');

// Variabel global
let currentKodeProduk = "Memuat...";

// --- Keamanan Admin ---
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.email !== 'admin123@gmail.com') {
            alert("Akses ditolak.");
            window.location.href = 'index.html'; 
        }
    } else {
        alert("Silakan login sebagai Admin.");
        window.location.href = 'login.html'; 
    }
});

// --- BACA DATA PRODUK (Untuk ambil Kode & Nama) ---
docRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        currentKodeProduk = data.kodeProduk || "N/A";
        const namaProduk = data.namaProduk || "Produk";
        
        // Update judul halaman
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

                // --- FILTER MANUAL DI SINI ---
                // 1. Cek status
                if (order.status === 'Active' || order.status === 'Completed') {
                    // 2. Cek produk
                    if (order.productIds && order.productIds.includes(productId)) {
                    
                        dataDitemukan = true; 

                        const deliveryData = existingPengiriman[orderId];
                        const nomorPengiriman = `SHP-${orderId.substring(0, 8).toUpperCase()}`;
                        
                        let sopir = 'N/A';
                        let kendaraan = 'N/A';
                        let rute = 'N/A';
                        let aksiButton = `<button class="btn-info btn-input-delivery" data-order-id="${orderId}">Input Pengiriman</button>`;
                        let statusPesananText = order.status === 'Active' ? 'Siap Kirim' : 'Selesai';

                        if (deliveryData) {
                            sopir = deliveryData.sopir;
                            kendaraan = deliveryData.kendaraan;
                            rute = deliveryData.rute;
                            
                            aksiButton = `
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
                            <td><strong>${currentKodeProduk}</strong></td> <td>${sopir}</td>
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
            confirmButtonText: 'Simpan & Atur Status',
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
            pengirimanRef.doc(orderId).set({
                sopir: formValues.sopir,
                kendaraan: formValues.kendaraan,
                rute: formValues.rute,
                status: "Pending", // Status pengiriman default
                orderId: orderId,
                tanggal: new Date()
            })
            .then(() => {
                Swal.fire('Sukses!', 'Pengiriman telah diinput, status: Menunggu Dikirim.', 'success');
            })
            .catch(e => Swal.fire('Error', e.message, 'error'));
        }
    }
});

// --- FUNGSI UPDATE STATUS PENGIRIMAN (Dropdown) ---
deliveryTableBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('status-select-delivery')) {
        const newStatus = e.target.value;
        const id = e.target.getAttribute('data-id'); 

        pengirimanRef.doc(id).update({
            status: newStatus
        })
        .then(() => {
            if (newStatus === 'Completed') { // "Selesai Dikirim"
                 ordersRef.doc(id).update({ status: 'Completed' });
            } else { // "Menunggu Dikirim" atau "Sedang Dikirim"
                 ordersRef.doc(id).update({ status: 'Active' });
            }

            e.target.className = `status-select-delivery status-${newStatus}`;
            Swal.fire({
                title: 'Status Pengiriman Diperbarui!',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        })
        .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});

// --- EVENT LISTENER BARU UNTUK DROPDOWN ---
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