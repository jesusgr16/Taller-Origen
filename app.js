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
const btnMenu = $("btnMenu");
const menuOverlay = $("menuOverlay");
const btnDarkMode = $("btnDarkMode");
const listaVentas = $("listaVentas");
const clienteInput = $("cliente");
const productoInput = $("producto");
const precioTotalInput = $("precioTotal");
const btnGuardar = $("btnGuardar");
const listaProductosEl = $("listaProductos");
const btnAddProducto = $("btnAddProducto");
const btnAddProductoGrande = $("btnAddProductoGrande");

let userId = null;
let productos = [];
let grafica = null;
let ventaEditandoId = null;

// ===============================
// AUTH STATE
// ===============================
onAuthStateChanged(auth, user => {
  if (user) {
    userId = user.uid;
    loginView.style.display = "none";
    appView.style.display = "block";
    btnGuardar.disabled = false;
    cargarVentas();
  } else {
    userId = null;
    loginView.style.display = "block";
    appView.style.display = "none";
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
// PRODUCTOS
// ===============================
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

window.agregarProducto = agregarProducto;

if (btnAddProducto) btnAddProducto.onclick = agregarProducto;
if (btnAddProductoGrande) btnAddProductoGrande.onclick = agregarProducto;

function renderProductos() {
  listaProductosEl.innerHTML = "";

  productos.forEach((p, i) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${p.nombre}</strong>
      <br>
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

      const subtotal = (p.precioProducto + p.precioGrabado) * p.cantidad;
      subtotalEl.textContent = subtotal.toFixed(2);
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
// GUARDAR / EDITAR VENTA
// ===============================
btnGuardar.onclick = async () => {
  if (!auth.currentUser) return alert("Espera sesión");

  const cliente = clienteInput.value.trim();
  if (!cliente) return alert("Ingresa cliente");
  if (productos.length === 0) return alert("Agrega productos");

  const total = Number(precioTotalInput.textContent.replace("$", "")) || 0;

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
// PINTAR VENTA
// ===============================
function pintarVenta(id, v) {
  const li = document.createElement("li");

  const productosTexto = v.productos
    .map(p => `${p.nombre} x${p.cantidad}`)
    .join("<br>");

  li.innerHTML = `
    <b>${v.cliente}</b><br>
    ${productosTexto}<br>
    <b>Total: $${v.total}</b>
    <br>
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
// CARGAR VENTAS
// ===============================
async function cargarVentas() {
  listaVentas.innerHTML = "";
  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));
  snap.forEach(d => {
    pintarVenta(d.id, d.data());
  });
}
