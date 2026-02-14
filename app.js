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
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// CONFIG
// ===============================
const firebaseConfig = {
  apiKey: "TU_API_KEY",
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

const listaVentas = $("listaVentas");
const listaHistorial = $("listaHistorial");

const clienteInput = $("cliente");
const productoInput = $("producto");
const precioTotalInput = $("precioTotal");
const btnGuardar = $("btnGuardar");

const totalHoyEl = $("totalHoy");
const totalMesEl = $("totalMes");

const listaProductosEl = $("listaProductos");
const btnAddProducto = $("btnAddProductoGrande");

let userId = null;
let productos = [];
let grafica = null;
let ventaEditandoId = null;

// ===============================
// AUTH
// ===============================
onAuthStateChanged(auth, user => {
  if (user) {
    userId = user.uid;
    loginView.style.display = "none";
    appView.style.display = "block";
    cargarVentas();
  } else {
    loginView.style.display = "block";
    appView.style.display = "none";
  }
});

btnRegister.onclick = async () => {
  await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
};

btnLogin.onclick = async () => {
  await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
};

btnLogout.onclick = () => signOut(auth);

// ===============================
// PRODUCTOS
// ===============================
btnAddProducto.onclick = agregarProducto;
window.agregarProducto = agregarProducto;

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

function renderProductos() {
  listaProductosEl.innerHTML = "";

  productos.forEach((p, i) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${p.nombre}</strong><br>
      Producto: <input type="number" value="${p.precioProducto}">
      Grabado: <input type="number" value="${p.precioGrabado}">
      Cantidad: <input type="number" value="${p.cantidad}">
      <button class="eliminar">Eliminar</button>
      <div>Subtotal: $<span class="subtotal">0.00</span></div>
    `;

    const inputs = li.querySelectorAll("input");
    const subtotalEl = li.querySelector(".subtotal");

    function actualizar() {
      p.precioProducto = Number(inputs[0].value) || 0;
      p.precioGrabado = Number(inputs[1].value) || 0;
      p.cantidad = Number(inputs[2].value) || 1;

      subtotalEl.textContent =
        ((p.precioProducto + p.precioGrabado) * p.cantidad).toFixed(2);

      calcularTotal();
    }

    inputs.forEach(inp => inp.oninput = actualizar);

    li.querySelector(".eliminar").onclick = () => {
      productos.splice(i, 1);
      renderProductos();
      calcularTotal();
    };

    actualizar();
    listaProductosEl.appendChild(li);
  });
}

function calcularTotal() {
  let total = 0;
  productos.forEach(p => {
    total += (p.precioProducto + p.precioGrabado) * p.cantidad;
  });
  precioTotalInput.textContent = "$" + total.toFixed(2);
}

// ===============================
// GUARDAR
// ===============================
btnGuardar.onclick = async () => {
  const cliente = clienteInput.value.trim();
  if (!cliente) return alert("Ingresa cliente");
  if (productos.length === 0) return alert("Agrega productos");

  const total = Number(precioTotalInput.textContent.replace("$", ""));

  if (ventaEditandoId) {
    await updateDoc(doc(db, `usuarios/${userId}/ventas/${ventaEditandoId}`), {
      cliente,
      productos,
      total
    });
    ventaEditandoId = null;
    btnGuardar.textContent = "Guardar venta";
  } else {
    await addDoc(collection(db, `usuarios/${userId}/ventas`), {
      cliente,
      productos,
      total,
      pagado: false,
      fecha: Timestamp.now()
    });
  }

  clienteInput.value = "";
  productos = [];
  renderProductos();
  calcularTotal();
  cargarVentas();
};

// ===============================
// PINTAR VENTAS
// ===============================
function pintarVenta(id, v) {
  const li = document.createElement("li");

  const productosTexto = v.productos
    .map(p => `${p.nombre} x${p.cantidad}`)
    .join("<br>");

  li.innerHTML = `
    <b>${v.cliente}</b><br>
    ${productosTexto}<br>
    <b>Total: $${v.total}</b><br>
    <button class="pagar">Pagado</button>
    <button class="editar">Editar</button>
    <button class="eliminar">Eliminar</button>
  `;

  li.querySelector(".pagar").onclick = async () => {
    await updateDoc(doc(db, `usuarios/${userId}/ventas/${id}`), { pagado: true });
    cargarVentas();
  };

  li.querySelector(".editar").onclick = () => {
    clienteInput.value = v.cliente;
    productos = v.productos;
    renderProductos();
    calcularTotal();
    ventaEditandoId = id;
    btnGuardar.textContent = "Actualizar venta";
  };

  li.querySelector(".eliminar").onclick = async () => {
    if (confirm("¿Eliminar venta?")) {
      await deleteDoc(doc(db, `usuarios/${userId}/ventas/${id}`));
      cargarVentas();
    }
  };

  listaVentas.appendChild(li);
}

// ===============================
// CARGAR VENTAS + TOTALES
// ===============================
async function cargarVentas() {
  listaVentas.innerHTML = "";
  listaHistorial.innerHTML = "";

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));

  let totalHoy = 0;
  let totalMes = 0;
  const hoy = new Date();

  snap.forEach(d => {
    const v = d.data();
    const fecha = v.fecha?.toDate();
    if (!fecha) return;

    if (!v.pagado) {
      pintarVenta(d.id, v);
    } else {
      const li = document.createElement("li");
      li.innerHTML = `<b>${v.cliente}</b> - $${v.total}`;
      listaHistorial.appendChild(li);
    }

    if (v.pagado) {
      if (
        fecha.getDate() === hoy.getDate() &&
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      ) {
        totalHoy += v.total;
      }

      if (
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      ) {
        totalMes += v.total;
      }
    }
  });

  totalHoyEl.textContent = "$" + totalHoy.toFixed(2);
  totalMesEl.textContent = "$" + totalMes.toFixed(2);

  cargarGrafica();
}

// ===============================
// GRAFICA
// ===============================
async function cargarGrafica() {
  const canvas = document.getElementById("graficaVentas");
  if (!canvas) return;

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));

  const dias = {};
  snap.forEach(d => {
    const v = d.data();
    if (!v.pagado) return;
    const fecha = v.fecha?.toDate();
    if (!fecha) return;
    const dia = fecha.getDate();
    dias[dia] = (dias[dia] || 0) + v.total;
  });

  const labels = Object.keys(dias);
  const data = Object.values(dias);

  if (grafica) grafica.destroy();

  grafica = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels.map(d => "Día " + d),
      datasets: [{
        label: "Ventas pagadas",
        data: data,
        borderWidth: 3,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}
