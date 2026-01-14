// ===============================
// FIREBASE IMPORTS
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
  deleteDoc,
  query,
  orderBy,
  Timestamp
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// DOM
// ===============================
const $ = id => document.getElementById(id);

const loginView = $("login");
const appView = $("app");

const emailInput = $("email");
const passwordInput = $("password");

const btnLogin = $("btnLogin");
const btnRegister = $("btnRegister");
const btnLogout = $("btnLogout");

const btnMenu = $("btnMenu");
const menuOverlay = $("menuOverlay");
const btnDarkMode = $("btnDarkMode");

const listaVentas = $("listaVentas");
const listaHistorial = $("listaHistorial");

const clienteInput = $("cliente");
const productoInput = $("producto");
const precioProductoInput = $("precioProducto");
const precioGrabadoInput = $("precioGrabado");
const precioTotalInput = $("precioTotal");
const btnGuardar = $("btnGuardar");

const totalHoyEl = $("totalHoy");
const totalMesEl = $("totalMes");

const listaProductosEl = $("listaProductos");
const btnAddProducto = $("btnAddProducto");

let userId = null;
let productos = [];

// ===============================
// AUTH STATE
// ===============================
onAuthStateChanged(auth, user => {
  if (user) {
    userId = user.uid;
    loginView.style.display = "none";
    appView.style.display = "block";
    btnMenu.style.display = "block";
    btnGuardar.disabled = false;
    cargarVentas();
  } else {
    userId = null;
    loginView.style.display = "block";
    appView.style.display = "none";
    btnMenu.style.display = "none";
    btnGuardar.disabled = true;
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
// TOTAL
// ===============================
function obtenerCantidadTotal() {
  if (productos.length === 0) return 1;
  return productos.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0);
}

function calcularTotal() {
  const cantidad = obtenerCantidadTotal();
  const precio = Number(precioProductoInput.value) || 0;
  const grabado = Number(precioGrabadoInput.value) || 0;
  precioTotalInput.value = (cantidad * precio) + grabado;
}

precioProductoInput.oninput = calcularTotal;
precioGrabadoInput.oninput = calcularTotal;

// ===============================
// PRODUCTOS
// ===============================
function agregarProducto() {
  const nombre = productoInput.value.trim();
  if (!nombre) return;

  productos.push({ nombre, cantidad: 1 });
  productoInput.value = "";
  renderProductos();
  calcularTotal();
}

btnAddProducto.onclick = agregarProducto;

function renderProductos() {
  listaProductosEl.innerHTML = "";
  productos.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${p.nombre}</span>
      <input type="number" min="1" value="${p.cantidad}">
    `;
    li.querySelector("input").oninput = e => {
      productos[i].cantidad = Number(e.target.value) || 1;
      calcularTotal();
    };
    listaProductosEl.appendChild(li);
  });
}

// ===============================
// GUARDAR
// ===============================
btnGuardar.onclick = async () => {
  if (!auth.currentUser) return alert("Sesión no lista, espera un momento");

  const cliente = clienteInput.value.trim();
  if (!cliente) return alert("Ingresa el cliente");
  if (productos.length === 0) return alert("Agrega al menos un producto");

  const producto = productos.map(p => `${p.nombre} x${p.cantidad}`).join(", ");
  const total = Number(precioTotalInput.value) || 0;

  try {
    await addDoc(collection(db, `usuarios/${userId}/ventas`), {
      cliente,
      producto,
      precioProducto: Number(precioProductoInput.value) || 0,
      precioGrabado: Number(precioGrabadoInput.value) || 0,
      precio: total,
      pagado: false,
      fecha: Timestamp.now()
    });

    clienteInput.value = "";
    precioProductoInput.value = "";
    precioGrabadoInput.value = "";
    precioTotalInput.value = "";
    productos = [];
    renderProductos();
    cargarVentas();

  } catch (e) {
    console.error("ERROR FIRESTORE:", e);
    alert(e.message);
  }
};

// ===============================
// CARGAR VENTAS (FIX DEFINITIVO)
// ===============================
async function cargarVentas() {
  if (!userId) return;

  listaVentas.innerHTML = "";
  listaHistorial.innerHTML = "";

  let hoy = 0;
  let mes = 0;
  const ahora = new Date();

  const ventasRef = collection(db, `usuarios/${userId}/ventas`);
  const q = query(ventasRef, orderBy("fecha", "desc"));
  const snap = await getDocs(q);

  snap.forEach(d => {
    const v = d.data();
    const fecha = v.fecha?.toDate ? v.fecha.toDate() : new Date();

    if (
      fecha.getDate() === ahora.getDate() &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    ) hoy++;

    if (
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    ) mes++;

    v.pagado ? pintarHistorial(v) : pintarVenta(d.id, v);
  });

  totalHoyEl.textContent = hoy;
  totalMesEl.textContent = mes;
}

// ===============================
// PINTAR
// ===============================
function pintarVenta(id, v) {
  const li = document.createElement("li");

  li.innerHTML = `
    <b>${v.cliente}</b><br>
    ${v.producto}<br>
    Producto: $${v.precioProducto}<br>
    Grabado: $${v.precioGrabado}<br>
    <b>Total: $${v.precio}</b>

    <div class="acciones">
      <button class="primary pagar">Pagado</button>
      <button class="secondary editar">Editar</button>
      <button class="danger eliminar">Eliminar</button>
    </div>
  `;

  // PAGADO
  li.querySelector(".pagar").onclick = async () => {
    await updateDoc(
      doc(db, `usuarios/${userId}/ventas/${id}`),
      { pagado: true }
    );
    cargarVentas();
  };

  // EDITAR
  li.querySelector(".editar").onclick = () => {
    clienteInput.value = v.cliente;
    precioProductoInput.value = v.precioProducto;
    precioGrabadoInput.value = v.precioGrabado;
    precioTotalInput.value = v.precio;

    // reconstruir productos visualmente
    productos = v.producto.split(",").map(p => {
      const [nombre, cant] = p.trim().split(" x");
      return { nombre, cantidad: Number(cant) || 1 };
    });

    renderProductos();
  };

  // ELIMINAR
  li.querySelector(".eliminar").onclick = async () => {
    if (confirm("¿Eliminar venta?")) {
      await deleteDoc(doc(db, `usuarios/${userId}/ventas/${id}`));
      cargarVentas();
    }
  };

  listaVentas.appendChild(li);
}


// ===============================
// MENU
// ===============================
btnMenu.onclick = () => menuOverlay.classList.add("active");

menuOverlay.onclick = e => {
  if (e.target === menuOverlay) {
    menuOverlay.classList.remove("active");
  }
};

document.querySelectorAll(".menu-item[data-vista]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".vista").forEach(v => v.style.display = "none");
    document.getElementById(
      "vista" +
      btn.dataset.vista.charAt(0).toUpperCase() +
      btn.dataset.vista.slice(1)
    ).style.display = "block";
    menuOverlay.classList.remove("active");
  };
});
// ===============================
// MODO OSCURO (FIX DEFINITIVO)
// ===============================
const darkSaved = localStorage.getItem("darkMode");

if (darkSaved === "on") {
  document.body.classList.add("dark");
}

btnDarkMode.onclick = () => {
  document.body.classList.toggle("dark");

  const activo = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", activo ? "on" : "off");

  btnDarkMode.textContent = activo
    ? "☀️ Modo claro"
    : "🌙 Modo oscuro";
};



