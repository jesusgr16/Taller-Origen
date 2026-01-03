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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// DOM
// ===============================
const loginView = document.getElementById("login");
const appView = document.getElementById("app");

const listaVentas = document.getElementById("listaVentas");
const listaHistorial = document.getElementById("listaHistorial");

const clienteInput = document.getElementById("cliente");
const productoInput = document.getElementById("producto");
const precioInput = document.getElementById("precio");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const busquedaInput = document.getElementById("busqueda");

const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const btnGuardar = document.getElementById("btnGuardar");
const btnLogout = document.getElementById("btnLogout");

const btnMenu = document.getElementById("btnMenu");
const menuOverlay = document.getElementById("menuOverlay");

let userId = null;
let chart = null;

// ===============================
// AUTH STATE
// ===============================


// ===============================
// AUTH
// ===============================
btnRegister.addEventListener("click", async () => {
  if (!emailInput.value || !passwordInput.value) {
    alert("Completa los campos");
    return;
  }
  await createUserWithEmailAndPassword(
    auth,
    emailInput.value,
    passwordInput.value
  );
});

btnLogin.addEventListener("click", async () => {
  if (!emailInput.value || !passwordInput.value) {
    alert("Completa los campos");
    return;
  }
  await signInWithEmailAndPassword(
    auth,
    emailInput.value,
    passwordInput.value
  );
});

btnLogout.addEventListener("click", () => {
  if (confirm("¿Cerrar sesión?")) {
    signOut(auth);
  }
});

// ===============================
// GUARDAR VENTA
// ===============================
btnGuardar.addEventListener("click", async () => {
  if (!userId) return;

  if (!clienteInput.value || !productoInput.value || !precioInput.value) {
    alert("Completa todos los campos");
    return;
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
});

// ===============================
// CARGAR VENTAS
// ===============================
async function cargarVentas() {
  listaVentas.innerHTML = "";
  listaHistorial.innerHTML = "";

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));

  snap.forEach(d => {
    const venta = d.data();
    if (venta.pagado) {
      pintarHistorial(venta);
    } else {
      pintarVenta(d.id, venta);
    }
  });

  calcularTotales();
}

// ===============================
// PINTAR
// ===============================
function pintarVenta(id, venta) {
  const li = document.createElement("li");
  li.innerHTML = `
    <b>${venta.cliente}</b><br>
    ${venta.producto}<br>
    $${venta.precio}<br>
    <button class="pagar">Marcar pagado</button>
  `;

  li.querySelector(".pagar").addEventListener("click", async () => {
    await updateDoc(doc(db, `usuarios/${userId}/ventas/${id}`), {
      pagado: true
    });
    cargarVentas();
  });

  listaVentas.appendChild(li);
}

function pintarHistorial(venta) {
  const li = document.createElement("li");
  li.textContent = `${venta.cliente} - ${venta.producto} ($${venta.precio})`;
  listaHistorial.appendChild(li);
}

// ===============================
// BUSQUEDA
// ===============================
busquedaInput.addEventListener("input", async () => {
  listaVentas.innerHTML = "";
  const texto = busquedaInput.value.toLowerCase();

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));
  snap.forEach(d => {
    const v = d.data();
    if (!v.pagado && v.cliente.toLowerCase().includes(texto)) {
      pintarVenta(d.id, v);
    }
  });
});

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
    if (
      f.getMonth() === ahora.getMonth() &&
      f.getFullYear() === ahora.getFullYear()
    ) mes++;
  });

  document.getElementById("totalHoy").textContent = hoy;
  document.getElementById("totalMes").textContent = mes;
}

// ===============================
// VISTAS
// ===============================
function mostrarVista(vista) {
  document.getElementById("vistaVentas").style.display = "none";
  document.getElementById("vistaHistorial").style.display = "none";
  document.getElementById("vistaGrafica").style.display = "none";

  if (vista === "ventas") {
    document.getElementById("vistaVentas").style.display = "block";
  }

  if (vista === "historial") {
    document.getElementById("vistaHistorial").style.display = "block";
  }

  if (vista === "grafica") {
    document.getElementById("vistaGrafica").style.display = "block";
    cargarGrafica();
  }
}

// ===============================
// GRAFICA
// ===============================
async function cargarGrafica() {
  const datos = Array(12).fill(0);
  const año = new Date().getFullYear();

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));
  snap.forEach(d => {
    const v = d.data();
    if (!v.pagado) return;
    const f = v.fecha.toDate();
    if (f.getFullYear() === año) {
      datos[f.getMonth()] += v.precio;
    }
  });

  const ctx = document.getElementById("graficaVentas");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
      datasets: [{
        label: "Ventas ($)",
        data: datos,
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ===============================
// MENU FLOTANTE
// ===============================
btnMenu.addEventListener("click", () => {
  menuOverlay.classList.add("active");
});

menuOverlay.addEventListener("click", e => {
  if (e.target === menuOverlay) {
    menuOverlay.classList.remove("active");
  }
});

document.querySelectorAll(".menu-item[data-vista]").forEach(btn => {
  btn.addEventListener("click", () => {
    mostrarVista(btn.dataset.vista);
    menuOverlay.classList.remove("active");
  });
});

