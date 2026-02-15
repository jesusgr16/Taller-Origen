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
const precioTotalInput = $("precioTotal");
const btnGuardar = $("btnGuardar");

const totalHoyEl = $("totalHoy");
const totalMesEl = $("totalMes");

const listaProductosEl = $("listaProductos");
const btnAddProducto = $("btnAddProducto");
const btnAddProductoGrande = $("btnAddProductoGrande");

let userId = null;
let productos = [];
let grafica = null;

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
// AUTH
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
// PRODUCTOS MULTIPLES CON PRECIOS INDIVIDUALES
// ===============================
function agregarProducto() {
  const nombre = productoInput.value.trim();
  if (!nombre) return;

  productos.push({
    nombre,
    cantidad: 1,
    precioProducto: 0,
    precioGrabado: 0
  });

  productoInput.value = "";
  renderProductos();
  calcularTotal();
}

if (btnAddProducto) btnAddProducto.onclick = agregarProducto;
if (btnAddProductoGrande) btnAddProductoGrande.onclick = agregarProducto;
function renderProductos() {
  listaProductosEl.innerHTML = "";

  productos.forEach((p, i) => {
    const li = document.createElement("li");
    li.classList.add("producto-item");

   li.innerHTML = `
  <div class="producto-card">

    <div class="producto-nombre-centro">
      ${p.nombre}
    </div>

    <div class="producto-fila">

      <div class="campo">
        <span>Cantidad</span>
        <input type="number" min="1" value="${p.cantidad}" class="cantidad input-suave" />
      </div>

      <div class="campo">
        <span>Precio producto</span>
        <input type="number" min="0" value="${p.precioProducto}" class="precioProducto input-suave" />
      </div>

      <div class="campo">
        <span>Precio grabado</span>
        <input type="number" min="0" value="${p.precioGrabado}" class="precioGrabado input-suave" />
      </div>

      <div class="campo subtotal-box">
        <span>Subtotal</span>
        <b>$${(p.cantidad * (p.precioProducto + p.precioGrabado)).toFixed(2)}</b>
      </div>

      <div class="campo eliminar-box">
        <span>Eliminar</span>
        <button class="btn-eliminar-producto btn-suave">🗑️</button>
      </div>

    </div>

  </div>
`;


    const cantidadInput = li.querySelector(".cantidad");
    const prodInput = li.querySelector(".precioProducto");
    const grabInput = li.querySelector(".precioGrabado");
    const subtotalDiv = li.querySelector(".subtotal-box b");


    function actualizar() {
      p.cantidad = Number(cantidadInput.value) || 1;
      p.precioProducto = Number(prodInput.value) || 0;
      p.precioGrabado = Number(grabInput.value) || 0;

      const total = p.cantidad * (p.precioProducto + p.precioGrabado);
      subtotalDiv.textContent = `$${total.toFixed(2)}`;

      calcularTotal();
    }

    cantidadInput.oninput = actualizar;
    prodInput.oninput = actualizar;
    grabInput.oninput = actualizar;

    li.querySelector(".btn-eliminar-producto").onclick = () => {
      productos.splice(i, 1);
      renderProductos();
      calcularTotal();
    };

    listaProductosEl.appendChild(li);
  });
}


function calcularTotal() {
  let totalGeneral = 0;

  productos.forEach(p => {
    totalGeneral += p.cantidad * (p.precioProducto + p.precioGrabado);
  });

  precioTotalInput.value = totalGeneral.toFixed(2);
}

function actualizar() {
  p.cantidad = Number(cantidadInput.value) || 1;
  p.precioProducto = Number(prodInput.value) || 0;
  p.precioGrabado = Number(grabInput.value) || 0;

  const total = p.cantidad * (p.precioProducto + p.precioGrabado);
  subtotalDiv.textContent = `$${total.toFixed(2)}`;

  calcularTotal();
}

// ===============================
// GUARDAR VENTA
// ===============================
btnGuardar.onclick = async () => {
  if (!auth.currentUser) return alert("Sesión no lista");

  const cliente = clienteInput.value.trim();
  if (!cliente) return alert("Ingresa el cliente");
  if (productos.length === 0) return alert("Agrega al menos un producto");

  const total = Number(precioTotalInput.value) || 0;

  const productoTexto = productos.map(p =>
    `${p.nombre} x${p.cantidad} (Prod:$${p.precioProducto} Grab:$${p.precioGrabado})`
  ).join(", ");

  await addDoc(collection(db, `usuarios/${userId}/ventas`), {
    cliente,
    producto: productoTexto,
    precio: total,
    pagado: false,
    fecha: Timestamp.now()
  });

  clienteInput.value = "";
  precioTotalInput.value = "";
  productos = [];
  renderProductos();
  cargarVentas();
};

// ===============================
// CARGAR VENTAS
// ===============================
async function cargarVentas() {
  if (!userId) return;

  listaVentas.innerHTML = "";
  listaHistorial.innerHTML = "";

  let hoy = 0;
  let mes = 0;
  const ahora = new Date();

  const ventasRef = collection(db, `usuarios/${userId}/ventas`);
  const q = query(ventasRef, orderBy("fecha", "asc"));
  const snap = await getDocs(q);

  snap.forEach(d => {
    const v = d.data();
    const fecha = v.fecha?.toDate();

    if (!fecha) return;

    if (
      fecha.getDate() === ahora.getDate() &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    ) hoy++;

    if (
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    ) mes++;

    if (v.pagado) {
  pintarHistorial(v);
} else {
  const li = pintarVenta(d.id, v);
  listaVentas.appendChild(li);
}

  totalHoyEl.textContent = hoy;
  totalMesEl.textContent = mes;
}

// ===============================
// PINTAR VENTA
// ===============================
function pintarVenta(id, v) {

  const li = document.createElement("li");

  li.innerHTML = `
    <strong>${v.cliente}</strong><br>
    ${v.producto}<br>
    <b>Total: $${v.precio}</b>

    <div class="acciones">
      <button class="btn-pagado">Pagado</button>
      <button class="btn-editar">Editar</button>

      <div class="dropdown">
        <button class="btn-acciones">
          Acciones <span class="flecha">›</span>
        </button>

        <div class="menu-acciones">
          <button class="opcion pendiente">Pendiente</button>
          <button class="opcion realizado">Realizado</button>
          <button class="opcion eliminar">Eliminar</button>
        </div>
      </div>
    </div>
  `;

  return li;
}


// ===============================
// PINTAR HISTORIAL
// ===============================
function pintarHistorial(v) {
  const li = document.createElement("li");

  li.innerHTML = `
    <b>${v.cliente}</b><br>
    ${v.producto}<br>
    <b>Total: $${v.precio}</b>
  `;

  listaHistorial.appendChild(li);
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

    if (btn.dataset.vista === "grafica") {
      cargarGraficaMensual();
    }

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

// ===============================
// GRAFICA LINEAL - SOLO PAGADAS + SELECTOR DE MES
// ===============================
async function cargarGraficaMensual(mesSeleccionado = null) {
  if (!userId) return;

  const canvas = document.getElementById("graficaVentas");
  const selector = document.getElementById("selectorMes");
  if (!canvas || !selector) return;

  // Llenar selector solo una vez
  if (selector.options.length === 0) {
    const meses = [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ];

    meses.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = m;
      selector.appendChild(opt);
    });

    selector.value = new Date().getMonth();

    selector.onchange = () => {
      cargarGraficaMensual(Number(selector.value));
    };
  }

  const mes = mesSeleccionado !== null
    ? mesSeleccionado
    : Number(selector.value);

  const añoActual = new Date().getFullYear();
  const ventasPorDia = {};
  let totalMes = 0;

  const ventasRef = collection(db, `usuarios/${userId}/ventas`);
  const snap = await getDocs(ventasRef);

  snap.forEach(d => {
    const v = d.data();

    // 🔒 SOLO VENTAS PAGADAS
    if (!v.pagado) return;

    const fecha = v.fecha?.toDate ? v.fecha.toDate() : null;
    if (!fecha) return;

    if (
      fecha.getMonth() === mes &&
      fecha.getFullYear() === añoActual
    ) {
      const dia = fecha.getDate();
      const precio = Number(v.precio) || 0;

      ventasPorDia[dia] = (ventasPorDia[dia] || 0) + precio;
      totalMes += precio;
    }
  });

  const dias = Object.keys(ventasPorDia)
    .map(Number)
    .sort((a, b) => a - b);

  const totales = dias.map(d => ventasPorDia[d]);

  // Mostrar total arriba
  const titulo = document.querySelector("#vistaGrafica h2");
  if (titulo) {
    titulo.textContent = `Total del mes: $${totalMes}`;
  }

  if (grafica) grafica.destroy();

  grafica = new Chart(canvas, {
    type: "line",
    data: {
      labels: dias.map(d => `Día ${d}`),
      datasets: [{
        label: "Ventas pagadas",
        data: totales,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 5
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
// 🧮 CALCULADORA INTERNA
// ===============================
function calcDisplay() {
  return document.getElementById("calcDisplay");
}

function calcAdd(v) {
  calcDisplay().value += v;
}

function calcClear() {
  calcDisplay().value = "";
}

function calcDel() {
  calcDisplay().value = calcDisplay().value.slice(0, -1);
}

function calcResult() {
  try {
    calcDisplay().value = eval(calcDisplay().value);
  } catch {
    calcDisplay().value = "Error";
  }
}
// ===============================
// 🧮 CALCULADORA (GLOBAL)
// ===============================
const calcDisplayEl = () => document.getElementById("calcDisplay");

window.calcAdd = function (v) {
  calcDisplayEl().value += v;
};

window.calcClear = function () {
  calcDisplayEl().value = "";
};

window.calcDel = function () {
  calcDisplayEl().value = calcDisplayEl().value.slice(0, -1);
};

window.calcResult = function () {
  try {
    calcDisplayEl().value = eval(calcDisplayEl().value);
  } catch {
    calcDisplayEl().value = "Error";
  }
};

window.calcResult = function () {
  try {
    calcDisplayEl().value = eval(calcDisplayEl().value);
  } catch {
    calcDisplayEl().value = "Error";
  }
};

  document.addEventListener("click", function(e) {
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach(drop => {
    const menu = drop.querySelector(".menu-acciones");

    if (drop.contains(e.target)) {
      menu.style.display =
        menu.style.display === "flex" ? "none" : "flex";
    } else {
      menu.style.display = "none";
    }
  });
});




















