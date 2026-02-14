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
const btnAddProductoGrande = $("btnAddProductoGrande");

if (btnAddProducto) {
  btnAddProducto.addEventListener("click", agregarProducto);
}

if (btnAddProductoGrande) {
  btnAddProductoGrande.addEventListener("click", agregarProducto);
}




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
  const precioProducto = Number(precioProductoInput.value) || 0;
  const precioGrabado = Number(precioGrabadoInput.value) || 0;

  const totalProducto = cantidad * precioProducto;
  const totalGrabado = cantidad * precioGrabado;

  precioTotalInput.value = totalProducto + totalGrabado;
}


precioProductoInput.oninput = calcularTotal;
precioGrabadoInput.oninput = calcularTotal;

// ===============================
// PRODUCTOS
// ===============================

// Agregar producto
function agregarProducto() {
  const nombre = productoInput.value.trim();
  if (!nombre) return;

  productos.push({
    nombre,
    precioProducto: 0,
    precioGrabado: 0,
    cantidad: 1
  });

  productoInput.value = "";
  renderProductos();
  calcularTotal();
}

// Renderizar productos
function renderProductos() {
  listaProductosEl.innerHTML = "";

  productos.forEach((p, i) => {
    const li = document.createElement("li");
    li.classList.add("producto-item");

    li.innerHTML = `
      <b>${p.nombre}</b><br>

      Precio producto:
      <input type="number" step="0.01" value="${p.precioProducto}"><br>

      Precio grabado:
      <input type="number" step="0.01" value="${p.precioGrabado}"><br>

      Cantidad:
      <input type="number" min="1" value="${p.cantidad}"><br>

      <b>Subtotal: $<span class="subtotal">0.00</span></b>

      <button class="btn-eliminar-producto">🗑️</button>
      <hr>
    `;

    const inputs = li.querySelectorAll("input");
    const subtotalEl = li.querySelector(".subtotal");

    function actualizar() {
      p.precioProducto = Number(inputs[0].value) || 0;
      p.precioGrabado = Number(inputs[1].value) || 0;
      p.cantidad = Number(inputs[2].value) || 1;

      const subtotal = (p.precioProducto + p.precioGrabado) * p.cantidad;
      subtotalEl.textContent = subtotal.toFixed(2);

      calcularTotal();
    }

    inputs.forEach(input => {
      input.oninput = actualizar;
    });

    li.querySelector(".btn-eliminar-producto").onclick = () => {
      productos.splice(i, 1);
      renderProductos();
      calcularTotal();
    };

    actualizar();
    listaProductosEl.appendChild(li);
  });
}

// Calcular total general
function calcularTotal() {
  let total = 0;

  productos.forEach(p => {
    total += (p.precioProducto + p.precioGrabado) * p.cantidad;
  });

  precioTotalInput.value = total.toFixed(2);
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
  const q = query(ventasRef, orderBy("fecha", "asc"));
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
// ===============================
// PINTAR VENTA (FINAL)
// ===============================
function pintarVenta(id, v) {
  const li = document.createElement("li");

  const estado = v.estado || "pendiente";

  li.innerHTML = `
    <b>${v.cliente}</b><br>
    ${v.producto}<br>
    Producto: $${v.precioProducto}<br>
    Grabado: $${v.precioGrabado}<br>
    <b>Total: $${v.precio}</b>

    <div class="acciones">
      <button class="primary pagar">Pagado</button>
      <button class="secondary editar">Editar</button>

      <div class="estado-wrapper">
        <button class="estado-btn ${estado}">
          ${estado.charAt(0).toUpperCase() + estado.slice(1)} ▸
        </button>

        <div class="estado-menu">
          <button data-estado="pendiente">Pendiente</button>
          <button data-estado="realizado" class="realizado">Realizado</button>
          <button data-estado="eliminar" class="danger">Eliminar</button>
        </div>
      </div>
    </div>
  `;

  // ===============================
  // PAGADO
  // ===============================
  li.querySelector(".pagar").onclick = async () => {
    await updateDoc(doc(db, `usuarios/${userId}/ventas/${id}`), {
      pagado: true
    });
    cargarVentas();
  };

  // ===============================
  // EDITAR (si lo usas)
  // ===============================
  li.querySelector(".editar").onclick = () => {
    clienteInput.value = v.cliente;
    precioTotalInput.value = v.precio;
    ventaEditandoId = id;
    btnGuardar.textContent = "Actualizar venta";
  };

  // ===============================
  // MOSTRAR / OCULTAR MENÚ
  // ===============================
  const estadoBtn = li.querySelector(".estado-btn");
  const estadoMenu = li.querySelector(".estado-menu");

  estadoBtn.onclick = () => {
    estadoMenu.classList.toggle("show");
  };

  // ===============================
  // OPCIONES DE ESTADO
  // ===============================
  estadoMenu.querySelectorAll("button").forEach(btn => {
    btn.onclick = async () => {
      const opcion = btn.dataset.estado;

      if (opcion === "eliminar") {
        if (confirm("¿Eliminar esta venta?")) {
          await deleteDoc(doc(db, `usuarios/${userId}/ventas/${id}`));
        }
      } else {
        await updateDoc(doc(db, `usuarios/${userId}/ventas/${id}`), {
          estado: opcion
        });
      }

      cargarVentas();
    };
  });

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
// PINTAR HISTORIAL (FIX)
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


window.agregarProducto = agregarProducto;








