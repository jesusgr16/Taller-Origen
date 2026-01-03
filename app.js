// ===============================
// IMPORTS FIREBASE
// ===============================
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// ===============================
// CONFIG
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyABcOe4tsNjieYYEo3HwoUNxSqMhwvGJK0",
  authDomain: "taller-origen.firebaseapp.com",
  projectId: "taller-origen",
  storageBucket: "taller-origen.firebasestorage.app",
  messagingSenderId: "563693867578",
  appId: "1:563693867578:web:141c4c1afa09eeebfc5b03"
};

// ===============================
// INIT
// ===============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// VARIABLES DOM
// ===============================
const lista = document.getElementById("lista");
const clienteInput = document.getElementById("cliente");
const productoInput = document.getElementById("producto");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const busquedaInput = document.getElementById("busqueda");

let userId = null;

// ===============================
// AUTH STATE
// ===============================
onAuthStateChanged(auth, user => {
  if (user) {
    userId = user.uid;
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    cargarVentas();
  } else {
    userId = null;
    document.getElementById("login").style.display = "block";
    document.getElementById("app").style.display = "none";
    lista.innerHTML = "";
  }
});

// ===============================
// REGISTRO
// ===============================
async function registrar() {
  if (!emailInput.value || !passwordInput.value) {
    alert("Completa correo y contraseña");
    return;
  }
  await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
}

// ===============================
// LOGIN
// ===============================
async function login() {
  if (!emailInput.value || !passwordInput.value) {
    alert("Completa correo y contraseña");
    return;
  }
  await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
}

// ===============================
// LOGOUT
// ===============================
function logout() {
  const seguro = confirm("¿Seguro que deseas cerrar sesión?");
  if (seguro) {
    signOut(auth);
  }
}


// ===============================
// GUARDAR VENTA
// ===============================
async function guardar() {
  if (!userId) return alert("Inicia sesión");

  const cliente = clienteInput.value.trim();
  const producto = productoInput.value.trim();
  if (!cliente || !producto) return alert("Campos vacíos");

  await addDoc(collection(db, `usuarios/${userId}/ventas`), {
    cliente,
    producto,
    fecha: new Date()
  });

  clienteInput.value = "";
  productoInput.value = "";
  cargarVentas();
}

// ===============================
// MOSTRAR
// ===============================
function mostrar(venta) {
  const li = document.createElement("li");
  li.textContent = `${venta.cliente} - ${venta.producto}`;
  lista.appendChild(li);
}

// ===============================
// CARGAR VENTAS
// ===============================
async function cargarVentas() {
  lista.innerHTML = "";
  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));
  snap.forEach(doc => mostrar(doc.data()));
  calcularTotales();
}

// ===============================
// TOTALES
// ===============================
async function calcularTotales() {
  let hoy = 0, mes = 0;
  const ahora = new Date();

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));
  snap.forEach(doc => {
    const fecha = doc.data().fecha.toDate();
    if (fecha.toDateString() === ahora.toDateString()) hoy++;
    if (fecha.getMonth() === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()) mes++;
  });

  document.getElementById("totalHoy").textContent = hoy;
  document.getElementById("totalMes").textContent = mes;
}

// ===============================
// BUSQUEDA
// ===============================
busquedaInput.addEventListener("input", async () => {
  lista.innerHTML = "";
  const texto = busquedaInput.value.toLowerCase();

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));
  snap.forEach(doc => {
    const v = doc.data();
    if (v.cliente.toLowerCase().includes(texto)) mostrar(v);
  });
});

// ===============================
// SERVICE WORKER
// ===============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

// ===============================
// EVENTOS BOTONES
// ===============================
document.getElementById("btnLogin")?.addEventListener("click", login);
document.getElementById("btnRegister")?.addEventListener("click", registrar);
document.getElementById("btnGuardar")?.addEventListener("click", guardar);
document.getElementById("btnLogout")?.addEventListener("click", logout);

if (busquedaInput) {
  busquedaInput.addEventListener("input", async () => {
    lista.innerHTML = "";
    const texto = busquedaInput.value.toLowerCase();

    const snap = await getDocs(
      collection(db, `usuarios/${userId}/ventas`)
    );

    snap.forEach(doc => {
      const v = doc.data();
      if (v.cliente.toLowerCase().includes(texto)) {
        mostrar(v);
      }
    });
  });
}
