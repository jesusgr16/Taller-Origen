// ===============================
// IMPORTS FIREBASE
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
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
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// CONFIG FIREBASE
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
const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);

// ===============================
// DOM
// ===============================
const loginView = document.getElementById("login");
const appView = document.getElementById("app");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const btnLogout = document.getElementById("btnLogout");

const btnMenu = document.getElementById("btnMenu");
const menuOverlay = document.getElementById("menuOverlay");
const btnDarkMode = document.getElementById("btnDarkMode");

const listaVentas = document.getElementById("listaVentas");
const listaHistorial = document.getElementById("listaHistorial");

const clienteInput = document.getElementById("cliente");
const productoInput = document.getElementById("producto");
const precioProductoInput = document.getElementById("precioProducto");
const precioGrabadoInput = document.getElementById("precioGrabado");
const precioTotalInput = document.getElementById("precioTotal");
const btnGuardar = document.getElementById("btnGuardar");
const busquedaInput = document.getElementById("busqueda");

let userId = null;
let ventaEditandoId = null;
let chart = null;

// ===============================
// MODO OSCURO (🔥 FIX DEFINITIVO)
// ===============================
function aplicarModoOscuro(estado) {
  document.body.classList.toggle("dark", estado);
  localStorage.setItem("darkMode", estado ? "on" : "off");
  btnDarkMode.textContent = estado ? "☀️ Modo claro" : "🌙 Modo oscuro";
}

// prioridad: localStorage → sistema
const darkSaved = localStorage.getItem("darkMode");

if (darkSaved === "on") {
  aplicarModoOscuro(true);
} else if (darkSaved === null) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  aplicarModoOscuro(prefersDark);
}

btnDarkMode.onclick = () => {
  const activo = document.body.classList.contains("dark");
  aplicarModoOscuro(!activo);
  menuOverlay.classList.remove("active");
};

// ===============================
// AUTH STATE
// ===============================
onAuthStateChanged(auth, user => {
  if (user) {
    userId = user.uid;
    loginView.style.display = "none";
    appView.style.display = "block";
    btnMenu.style.display = "block";
    mostrarVista("ventas");
    cargarVentas();
  } else {
    userId = null;
    loginView.style.display = "block";
    appView.style.display = "none";
    btnMenu.style.display = "none";
  }
});

// ===============================
// AUTH ACTIONS
// ===============================
btnRegister.onclick = async () => {
  if (!emailInput.value || !passwordInput.value) return alert("Completa los campos");
  await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
};

btnLogin.onclick = async () => {
  if (!emailInput.value || !passwordInput.value) return alert("Completa los campos");
  await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
};

btnLogout.onclick = () => signOut(auth);

// ===============================
// TOTAL AUTOMÁTICO
// ===============================
function calcularTotal() {
  const p1 = Number(precioProductoInput.value) || 0;
  const p2 = Number(precioGrabadoInput.value) || 0;
  precioTotalInput.value = p1 + p2;
}

precioProductoInput.oninput = calcularTotal;
precioGrabadoInput.oninput = calcularTotal;

// ===============================
// GUARDAR / EDITAR VENTA
// ===============================
btnGuardar.onclick = async () => {
  const cliente = clienteInput.value.trim();
  const producto = productoInput.value.trim();
  const precioProducto = Number(precioProductoInput.value) || 0;
  const precioGrabado = Number(precioGrabadoInput.value) || 0;
  const total = precioProducto + precioGrabado;

  if (!cliente || !producto) return alert("Completa los campos");

  if (ventaEditandoId) {
    await updateDoc(doc(db, `usuarios/${userId}/ventas/${ventaEditandoId}`), {
      cliente, producto, precioProducto, precioGrabado, precio: total
    });
    ventaEditandoId = null;
    btnGuardar.textContent = "Guardar venta";
  } else {
    await addDoc(collection(db, `usuarios/${userId}/ventas`), {
      cliente, producto, precioProducto, precioGrabado,
      precio: total, pagado: false, fecha: new Date()
    });
  }

  clienteInput.value = "";
  productoInput.value = "";
  precioProductoInput.value = "";
  precioGrabadoInput.value = "";
  precioTotalInput.value = "";

  cargarVentas();
};

// ===============================
// MENU
// ===============================
btnMenu.onclick = () => menuOverlay.classList.add("active");
menuOverlay.onclick = e => {
  if (e.target === menuOverlay) menuOverlay.classList.remove("active");
};

document.querySelectorAll(".menu-item[data-vista]").forEach(b => {
  b.onclick = () => {
    mostrarVista(b.dataset.vista);
    menuOverlay.classList.remove("active");
  };
});
