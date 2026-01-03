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
  orderBy
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

let userId = null;
let ventaEditandoId = null;

// ===============================
// MODO OSCURO
// ===============================
function setDarkMode(on) {
  document.body.classList.toggle("dark", on);
  localStorage.setItem("darkMode", on ? "on" : "off");
  btnDarkMode.textContent = on ? "☀️ Modo claro" : "🌙 Modo oscuro";
}

setDarkMode(localStorage.getItem("darkMode") === "on");

btnDarkMode.onclick = () => {
  setDarkMode(!document.body.classList.contains("dark"));
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
  precioTotalInput.value =
    (Number(precioProductoInput.value) || 0) +
    (Number(precioGrabadoInput.value) || 0);
}
precioProductoInput.oninput = calcularTotal;
precioGrabadoInput.oninput = calcularTotal;

// ===============================
// GUARDAR / EDITAR
// ===============================
btnGuardar.onclick = async () => {
  if (!userId) return alert("Sesión inválida");

  const cliente = clienteInput.value.trim();
  const producto = productoInput.value.trim();
  const pProd = Number(precioProductoInput.value) || 0;
  const pGrab = Number(precioGrabadoInput.value) || 0;
  const total = pProd + pGrab;

  if (!cliente || !producto) return alert("Completa los campos");

  try {
    if (ventaEditandoId) {
      await updateDoc(doc(db, `usuarios/${userId}/ventas/${ventaEditandoId}`), {
        cliente, producto, precioProducto: pProd, precioGrabado: pGrab, precio: total
      });
      ventaEditandoId = null;
      btnGuardar.textContent = "Guardar venta";
    } else {
      await addDoc(collection(db, `usuarios/${userId}/ventas`), {
        cliente,
        producto,
        precioProducto: pProd,
        precioGrabado: pGrab,
        precio: total,
        pagado: false,
        fecha: new Date()
      });
    }

    clienteInput.value = "";
    productoInput.value = "";
    precioProductoInput.value = "";
    precioGrabadoInput.value = "";
    precioTotalInput.value = "";

    cargarVentas();
  } catch (e) {
    console.error(e);
    alert("Error al guardar venta");
  }
};

// ===============================
// CARGAR VENTAS + TOTALES
// ===============================
async function cargarVentas() {
  listaVentas.innerHTML = "";
  listaHistorial.innerHTML = "";

  let hoy = 0;
  let mes = 0;
  const ahora = new Date();

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));

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

  li.querySelector(".pagar").onclick = async () => {
    await updateDoc(doc(db, `usuarios/${userId}/ventas/${id}`), { pagado: true });
    cargarVentas();
  };

  li.querySelector(".editar").onclick = () => {
    clienteInput.value = v.cliente;
    productoInput.value = v.producto;
    precioProductoInput.value = v.precioProducto;
    precioGrabadoInput.value = v.precioGrabado;
    precioTotalInput.value = v.precio;
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

function pintarHistorial(v) {
  const li = document.createElement("li");
  li.textContent = `${v.cliente} - ${v.producto} ($${v.precio})`;
  listaHistorial.appendChild(li);
}

// ===============================
// MENU
// ===============================
btnMenu.onclick = () => menuOverlay.classList.add("active");
menuOverlay.onclick = e => {
  if (e.target === menuOverlay) menuOverlay.classList.remove("active");
};

// ===============================
// NAVEGACIÓN DEL MENÚ (FIX)
// ===============================
document.querySelectorAll(".menu-item[data-vista]").forEach(btn => {
  btn.addEventListener("click", () => {
    const vista = btn.dataset.vista;

    // ocultar todas
    document.getElementById("vistaVentas").style.display = "none";
    document.getElementById("vistaHistorial").style.display = "none";
    document.getElementById("vistaGrafica").style.display = "none";

    // mostrar la seleccionada
    document.getElementById(
      "vista" + vista.charAt(0).toUpperCase() + vista.slice(1)
    ).style.display = "block";

    // cerrar menú
    menuOverlay.classList.remove("active");
  });
});


