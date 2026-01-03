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
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

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

const listaVentas = document.getElementById("listaVentas");
const listaHistorial = document.getElementById("listaHistorial");

const clienteInput = document.getElementById("cliente");
const productoInput = document.getElementById("producto");
const precioProductoInput = document.getElementById("precioProducto");
const precioGrabadoInput = document.getElementById("precioGrabado");
const precioTotalInput = document.getElementById("precioTotal");

const busquedaInput = document.getElementById("busqueda");
const btnGuardar = document.getElementById("btnGuardar");

let userId = null;
let chart = null;

// ===============================
// AUTH STATE (CLAVE)
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
  if (!emailInput.value || !passwordInput.value) {
    alert("Completa los campos");
    return;
  }
  await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
};

btnLogin.onclick = async () => {
  if (!emailInput.value || !passwordInput.value) {
    alert("Completa los campos");
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (e) {
    alert(e.message);
  }
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
// GUARDAR VENTA
// ===============================
btnGuardar.onclick = async () => {
  if (!userId) return;

  if (
    !clienteInput.value ||
    !productoInput.value ||
    precioTotalInput.value === ""
  ) {
    alert("Completa todos los campos");
    return;
  }

  await addDoc(collection(db, `usuarios/${userId}/ventas`), {
    cliente: clienteInput.value,
    producto: productoInput.value,
    precioProducto: Number(precioProductoInput.value) || 0,
    precioGrabado: Number(precioGrabadoInput.value) || 0,
    precio: Number(precioTotalInput.value),
    pagado: false,
    fecha: new Date()
  });

  clienteInput.value = "";
  productoInput.value = "";
  precioProductoInput.value = "";
  precioGrabadoInput.value = "";
  precioTotalInput.value = "";

  cargarVentas();
};

// ===============================
// CARGAR VENTAS
// ===============================
async function cargarVentas() {
  if (!userId) return;

  listaVentas.innerHTML = "";
  listaHistorial.innerHTML = "";

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));

  snap.forEach(d => {
    const v = d.data();
    v.pagado ? pintarHistorial(v) : pintarVenta(d.id, v);
  });

  calcularTotales();
}

// ===============================
// PINTAR
// ===============================
function pintarVenta(id, v) {
  const li = document.createElement("li");
  li.innerHTML = `
    <b>${v.cliente}</b><br>
    ${v.producto}<br>
    Producto: $${v.precioProducto || 0}<br>
    Grabado: $${v.precioGrabado || 0}<br>
    <b>Total: $${v.precio}</b><br>
    <button>Marcar pagado</button>
  `;

  li.querySelector("button").onclick = async () => {
    await updateDoc(doc(db, `usuarios/${userId}/ventas/${id}`), { pagado: true });
    cargarVentas();
  };

  listaVentas.appendChild(li);
}

function pintarHistorial(v) {
  const li = document.createElement("li");
  li.textContent = `${v.cliente} - ${v.producto} ($${v.precio})`;
  listaHistorial.appendChild(li);
}

// ===============================
// BUSQUEDA
// ===============================
busquedaInput.oninput = async () => {
  if (!userId) return;

  listaVentas.innerHTML = "";
  const texto = busquedaInput.value.toLowerCase();

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));
  snap.forEach(d => {
    const v = d.data();
    if (!v.pagado && v.cliente.toLowerCase().includes(texto)) {
      pintarVenta(d.id, v);
    }
  });
};

// ===============================
// TOTALES
// ===============================
async function calcularTotales() {
  let hoy = 0, mes = 0;
  const ahora = new Date();

  const snap = await getDocs(collection(db, `usuarios/${userId}/ventas`));
  snap.forEach(d => {
    const f = d.data().fecha.toDate();
    if (f.toDateString() === ahora.toDateString()) hoy++;
    if (f.getMonth() === ahora.getMonth()) mes++;
  });

  document.getElementById("totalHoy").textContent = hoy;
  document.getElementById("totalMes").textContent = mes;
}

// ===============================
// VISTAS
// ===============================
function mostrarVista(vista) {
  ["vistaVentas", "vistaHistorial", "vistaGrafica"].forEach(id => {
    document.getElementById(id).style.display = "none";
  });

  document.getElementById(
    "vista" + vista.charAt(0).toUpperCase() + vista.slice(1)
  ).style.display = "block";

  if (vista === "grafica") cargarGrafica();
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
    if (v.pagado && v.fecha.toDate().getFullYear() === año) {
      datos[v.fecha.toDate().getMonth()] += v.precio;
    }
  });

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("graficaVentas"), {
    type: "line",
    data: {
      labels: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
      datasets: [{ label: "Ventas", data: datos, fill: true, tension: 0.3 }]
    }
  });
}

// ===============================
// MENU FLOTANTE
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
