// --- TEMPELKAN firebaseConfig ANDA DI SINI ---
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
// LOGIKA BARU: PEMBACA PRODUK (PRODUCT READER)
// =============================================
let productView = localStorage.getItem('currentProductView') || 'jagung';
const productId = (productView === 'jagung') ? 'jagung-001' : 'durian-002';

// Referensi
const usersRef = db.collection("users");
const ordersRef = db.collection("orders");

// Elemen DOM
const logoutButton = document.getElementById('admin-logout-button');
const cabangSelect = document.getElementById('cabang-select');
const alamatValue = document.getElementById('alamat-value');
const stokValue = document.getElementById('stok-value');
const permintaanValue = document.getElementById('permintaan-value');
const statusValue = document.getElementById('status-value');

// Variabel global
let allBranchesData = [];
let currentSelectedUserId = null; 

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

// --- Fungsi helper (tetap sama) ---
async function showEditPopup(title, inputValue, inputType = 'text') {
    const { value: newValue } = await Swal.fire({
        title: title, input: inputType, inputValue: inputValue,
        showCancelButton: true, confirmButtonText: 'Simpan', cancelButtonText: 'Batal'
    });
    return newValue;
}

// --- FUNGSI TAMPILKAN DATA CABANG (Dinamis) ---
async function displayBranchData(selectedUserId) {
    currentSelectedUserId = selectedUserId;
    
    // 1. Tampilkan data statis (Alamat & Status)
    const data = allBranchesData.find(branch => branch.id === selectedUserId);
    if (!data) return;

    alamatValue.textContent = data.alamat;
    if (data.status.toLowerCase() === 'aktif') {
        statusValue.innerHTML = `<span class="status-Active">Aktif</span>`;
    } else {
        statusValue.innerHTML = `<span class="status-Pending">${data.status}</span>`;
    }

    // 2. Tampilkan data dinamis (Stok & Permintaan)
    stokValue.textContent = "Menghitung...";
    permintaanValue.textContent = "Menghitung...";

    // Kita gunakan onSnapshot agar data otomatis update
    ordersRef.where("userId", "==", selectedUserId).onSnapshot((pesananQuery) => {
        let totalStok = 0;
        let totalPermintaan = 0;

        pesananQuery.forEach(doc => {
            const order = doc.data();
            
            // FILTER DINAMIS: Cek apakah 'productId' yang kita lihat ada di pesanan
            if (order.productIds && order.productIds.includes(productId)) {
                const itemDipesan = order.items.find(item => item.id === productId);
                const jumlahPcs = itemDipesan ? itemDipesan.quantity : 0;

                if (order.status === 'Completed') { // Selesai
                    totalStok += jumlahPcs;
                } else if (order.status === 'Active') { // Sudah Dikonfirmasi
                    totalPermintaan += jumlahPcs;
                }
            }
        });

        // Tampilkan hasil perhitungan
        stokValue.textContent = `${totalStok} Pcs`;
        permintaanValue.textContent = `${totalPermintaan} Pcs`;
    });
}


// --- FUNGSI MENGISI DROPDOWN (Tetap Sama) ---
function populateDropdown() {
    usersRef.where("role", "==", "konsumen")
    .onSnapshot((querySnapshot) => {
        allBranchesData = []; 
        cabangSelect.innerHTML = ''; 

        if (querySnapshot.empty) {
            cabangSelect.innerHTML = '<option>Belum ada cabang terdaftar</option>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id; 
            
            allBranchesData.push({ id, ...data });
            
            const option = document.createElement('option');
            option.value = id;
            option.textContent = data.namaCabang; 
            cabangSelect.appendChild(option);
        });

        if (allBranchesData.length > 0) {
            if (currentSelectedUserId && allBranchesData.find(b => b.id === currentSelectedUserId)) {
                cabangSelect.value = currentSelectedUserId;
            } else {
                currentSelectedUserId = allBranchesData[0].id; 
            }
            displayBranchData(currentSelectedUserId);
        }
    });
}

// --- EVENT LISTENER (Tetap Sama) ---
// ... (kode semua event listener Anda tetap sama)
document.addEventListener('DOMContentLoaded', populateDropdown);
cabangSelect.addEventListener('change', (e) => {
    displayBranchData(e.target.value);
});
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});

// --- FUNGSI EDIT (Hanya Alamat & Status) ---
document.getElementById('card-alamat').addEventListener('click', async (e) => {
    if (!e.target.classList.contains('btn-edit-card')) return;
    const newValue = await showEditPopup('Ubah Alamat', alamatValue.textContent);
    if (newValue) {
        usersRef.doc(currentSelectedUserId).update({ alamat: newValue })
            .then(() => Swal.fire('Sukses', 'Alamat diperbarui', 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});
document.getElementById('card-status').addEventListener('click', async (e) => {
    if (!e.target.classList.contains('btn-edit-card')) return;
    const currentStatus = allBranchesData.find(b => b.id === currentSelectedUserId).status;
    const newValue = await showEditPopup('Ubah Status Cabang', currentStatus);
    if (newValue) {
        usersRef.doc(currentSelectedUserId).update({ status: newValue })
            .then(() => Swal.fire('Sukses', 'Status diperbarui', 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});