// !!! GANTI DENGAN KONFIGURASI FIREBASE ANDA !!!
// Ini didapat dari Langkah 1 (Persiapan di Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyAEfBl_A3leDp8Kb73lI5Y51Sq_OYjLGsU",
  authDomain: "distributoreskrimsaya.firebaseapp.com",
  projectId: "distributoreskrimsaya",
  storageBucket: "distributoreskrimsaya.firebasestorage.app",
  messagingSenderId: "437181740843",
  appId: "1:437181740843:web:41890cdedddc45b903776e",
  measurementId: "G-3YJY51SZ90"
};
// ----------------------------------------------

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const registerForm = document.querySelector('form');

registerForm.addEventListener('submit', (e) => {
    e.preventDefault(); 

    // Ambil semua data baru
    const namaLengkap = registerForm['nama_lengkap'].value;
    const namaCabang = registerForm['nama_cabang'].value;
    const alamatCabang = registerForm['alamat_cabang'].value;
    const email = registerForm['email'].value;
    const password = registerForm['password'].value;

    // 1. Buat pengguna di Firebase Authentication
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // 2. Simpan data tambahan cabang di Firestore
            // KITA GUNAKAN `users` SEBAGAI DATABASE CABANG
            return db.collection("users").doc(user.uid).set({
                nama_lengkap: namaLengkap,
                namaCabang: namaCabang,
                alamat: alamatCabang,
                email: email,
                role: "konsumen", // Tetap 'konsumen' agar bisa login ke app
                status: "Aktif" // Status default
            });
        })
        .then(() => {
            Swal.fire({
                title: 'Pendaftaran Cabang Berhasil!',
                text: 'Akun Anda telah dibuat. Silakan login.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "login.html";
                }
            });
        })
        .catch((error) => {
            console.error("Error saat registrasi:", error);
            let pesanError = "Email ini sudah terdaftar.";
            if (error.code == 'auth/weak-password') {
                pesanError = "Password terlalu lemah. Minimal 6 karakter.";
            }
            Swal.fire({
                title: 'Pendaftaran Gagal',
                text: pesanError,
                icon: 'error',
                confirmButtonText: 'Tutup'
            });
        });
});