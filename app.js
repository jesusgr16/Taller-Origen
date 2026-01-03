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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
// DOM
// ===============================
const listaVentas = document.getElementById("listaVentas");
const listaHistorial = document.getElementById("listaHistorial");

const clienteInput = document.getElementById("cliente");
const productoInput = document.getElementById("producto");
const precioInput = document.getElementById("precio");

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
    document.getElementById("app").style.display = "flex";
    cargarVentas();
  } else {
    userId = null;
    document.getElementById("login").style.display = "block";
    document.getElementById("app").style.display = "none";
  }
});

// ===============================
// AUTH ACTIONS
// ===============================
async function registrar() {
  if (!emailInput.value || !passwordInput.value) return alert("Completa los campos");
  await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
}

async function login() {
  if (!emailInput.value || !passwordInput.value) return alert("Completa los campos");
  await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
}

function logout() {
  if (confirm("¿Cerrar sesión?")) {
    signOut(auth);
  }
}

// ===============================
// GUARDAR VENTA
// ===============================
async function guardar() {
  if (!userId) return;

  if (!clienteInput.value || !productoInput.value || !precioInput.value) {
    return alert("Completa todos los campos");
  }

  await addDoc(collection(db, `usuarios/${userId}/ventas`), {
    cliente: clienteInput.value,
    producto: productoInput.value,
    precio: Number(precioInput.value),
    pagado: false,
    fecha: new Date()
  });

  clienteInput.value = "";
  productoInput.value = "";
  precioInput.value = "";

  cargarVentas();
}

// ===============================
// MOSTRAR VENTAS
// ===============================
function pintarVenta(id, venta) {
  const li = document.createElement("li");
  li.innerHTML = `
    <b>${venta.cliente}</b> - ${venta.producto}
    <br>💲${venta.precio}
    <br>
    <button onclick="marcarPagado('${id}')">✅ Pagado</button>
  `;
  listaVentas.appendChild(li);
}

function pintarHistorial(venta) {
  const li = document.createElement("li");
  li.textContent = `✔ ${venta.cliente} - ${venta.producto} ($${venta.precio})`;
  listaHistorial.appendChild(li);
}

// ===============================
// CARGAR VENTAS
// ===============================
async function cargarVentas() {
  listaVentas.innerHTML = "";
  listaHistorial.innerHTML = "";

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));

  snap.forEach(docSnap => {
    const venta = docSnap.data();
    if (venta.pagado) {
      pintarHistorial(venta);
    } else {
      pintarVenta(docSnap.id, venta);
    }
  });

  calcularTotales();
}

// ===============================
// MARCAR COMO PAGADO
// ===============================
window.marcarPagado = async (id) => {
  const ref = doc(db, `usuarios/${userId}/ventas/${id}`);
  await updateDoc(ref, { pagado: true });
  cargarVentas();
};

// ===============================
// TOTALES
// ===============================
async function calcularTotales() {
  let hoy = 0;
  let mes = 0;
  const ahora = new Date();

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));
  snap.forEach(d => {
    const f = d.data().fecha.toDate();
    if (f.toDateString() === ahora.toDateString()) hoy++;
    if (f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear()) mes++;
  });

  document.getElementById("totalHoy").textContent = hoy;
  document.getElementById("totalMes").textContent = mes;
}

// ===============================
// BUSQUEDA
// ===============================
busquedaInput.addEventListener("input", async () => {
  const texto = busquedaInput.value.toLowerCase();
  listaVentas.innerHTML = "";

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));
  snap.forEach(docSnap => {
    const v = docSnap.data();
    if (!v.pagado && v.cliente.toLowerCase().includes(texto)) {
      pintarVenta(docSnap.id, v);
    }
  });
});

// ===============================
// EVENTOS BOTONES
// ===============================
document.getElementById("btnLogin").onclick = login;
document.getElementById("btnRegister").onclick = registrar;
document.getElementById("btnGuardar").onclick = guardar;
document.getElementById("btnLogout").onclick = logout;

let chart = null;

async function cargarGrafica() {
  const datos = Array(12).fill(0);
  const ahora = new Date();
  const añoActual = ahora.getFullYear();

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));

  snap.forEach(doc => {
    const venta = doc.data();
    if (!venta.pagado) return;

    const fecha = venta.fecha.toDate();
    if (fecha.getFullYear() === añoActual) {
      datos[fecha.getMonth()] += venta.precio;
    }
  });

  const ctx = document.getElementById("chartVentas");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        "Ene","Feb","Mar","Abr","May","Jun",
        "Jul","Ago","Sep","Oct","Nov","Dic"
      ],
      datasets: [{
        label: "Ventas ($)",
        data: datos,
        backgroundColor: "#1976d2"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

