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
// ----------------------------------------------

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); 

const loginForm = document.querySelector('form');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const email = loginForm['email'].value;
    const password = loginForm['password'].value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // --- LOGIKA BERBASIS PERAN (DIPERBAIKI) ---
            
            // 1. Cek apakah Admin ATAU Super Admin?
            if (user.email === 'admin123@gmail.com' || user.email === 'superadmin@gmail.com') {
                Swal.fire({
                    title: 'Login Admin Berhasil!', text: 'Mengarahkan ke halaman utama...',
                    icon: 'success', timer: 2000, 
                    showConfirmButton: false, allowOutsideClick: false 
                }).then(() => {
                    // --- INI PERUBAHANNYA ---
                    window.location.href = 'admin-greeting.html'; 
                    // -------------------------
                });
                return; // Hentikan proses
            }

            // 2. Jika bukan Admin, cek di database 'users'
            db.collection("users").doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    
                    if (userData.role === "sopir") {
                        // ... (Logika Sopir tetap sama)
                        window.location.href = 'lacak.html'; 
                    } else if (userData.role === "konsumen") {
                        // ... (Logika Cabang tetap sama)
                        localStorage.setItem('namaCabang', userData.namaCabang);
                        window.location.href = 'index.html'; 
                    } else {
                        auth.signOut();
                        Swal.fire('Login Gagal', 'Peran (role) akun Anda tidak dikenal.', 'error');
                    }
                    
                } else {
                    auth.signOut();
                    Swal.fire('Login Gagal', 'Data pengguna Anda tidak ditemukan di database.', 'error');
                }
            });
        })
        .catch((error) => {
            Swal.fire({
                title: 'Login Gagal',
                text: 'Email atau password yang Anda masukkan salah.',
                icon: 'error',
                confirmButtonText: 'Coba Lagi'
            });
        });
});