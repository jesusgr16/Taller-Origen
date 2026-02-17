



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

const listaProductosEl = $("listaProductos");
const btnAddProducto = $("btnAddProducto");
const btnAddProductoGrande = $("btnAddProductoGrande");
const precioTotalInput = $("precioTotal");
const btnGuardar = $("btnGuardar"); // 🔥 AHORA SÍ DECLARADO ANTES DE USARLO

const totalHoyEl = $("totalHoy");
const totalMesEl = $("totalMes");

// ===============================
// VARIABLES GLOBALES
// ===============================
let userId = null;
let productos = [];
let grafica = null;
let ventaEditandoId = null;
let ventaNotaActual = null;




// ===============================
// GUARDAR VENTA
// ===============================
btnGuardar.onclick = async () => {

  if (!clienteInput.value.trim()) {
    alert("Ingresa el cliente");
    return;
  }

  if (productos.length === 0) {
    alert("Agrega al menos un producto");
    return;
  }

  const totalGeneral = productos.reduce((acc, p) => {
    return acc + (p.cantidad * (p.precioProducto + p.precioGrabado));
  }, 0);

  const nuevaVenta = {
    cliente: clienteInput.value.trim(),
    productos: productos,
    precio: totalGeneral,
    fecha: new Date(),
    pagado: false
  };

  if (ventaEditandoId) {

    await updateDoc(
      doc(db, `usuarios/${userId}/ventas/${ventaEditandoId}`),
      nuevaVenta
    );

    ventaEditandoId = null;

  } else {

    await addDoc(
      collection(db, `usuarios/${userId}/ventas`),
      nuevaVenta
    );
  }

  limpiarCampos();
  productos = [];
  renderProductos();
  cargarVentas();
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

    <!-- TITULO ARRIBA -->
    <div class="producto-titulo">
      ${p.nombre}
    </div>

    <!-- CAMPOS -->
    <div class="producto-campos">

      <div class="campo">
        <label>Cantidades:</label>
        <input type="number" min="1" value="${p.cantidad}" class="cantidad">
      </div>

      <div class="campo">
        <label>Precio del producto:</label>
        <input type="number" min="0" value="${p.precioProducto}" class="precioProducto">
      </div>

      <div class="campo">
        <label>Precio del grabado:</label>
        <input type="number" min="0" value="${p.precioGrabado}" class="precioGrabado">
      </div>

    </div>

    <!-- SUBTOTAL -->
    <div class="subtotal-box">
      <span>Subtotal</span>
      <strong>$${(p.cantidad * (p.precioProducto + p.precioGrabado)).toFixed(2)}</strong>
    </div>

    <!-- ELIMINAR -->
    <div class="eliminar-box">
      <button class="btn-eliminar-producto">🗑 Eliminar</button>
    </div>

  </div>
`;


    const cantidadInput = li.querySelector(".cantidad");
    const prodInput = li.querySelector(".precioProducto");
    const grabInput = li.querySelector(".precioGrabado");
    const subtotalDiv = li.querySelector(".subtotal-box strong");


function actualizar() {
  productos[i].cantidad = Number(cantidadInput.value) || 1;
  productos[i].precioProducto = Number(prodInput.value) || 0;
  productos[i].precioGrabado = Number(grabInput.value) || 0;

  const total =
    productos[i].cantidad *
    (productos[i].precioProducto + productos[i].precioGrabado);

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
  if (!precioTotalInput) return;

  const total = productos.reduce((acc, p) => {
    const cantidad = Number(p.cantidad) || 0;
    const precioProducto = Number(p.precioProducto) || 0;
    const precioGrabado = Number(p.precioGrabado) || 0;

    return acc + (cantidad * (precioProducto + precioGrabado));
  }, 0);

  precioTotalInput.value = total.toFixed(2); // 🔥 AQUÍ ESTÁ EL CAMBIO
}



function limpiarCampos() {
  clienteInput.value = "";
  productos = [];
  renderProductos();
  ventaEditandoId = null;
}




// ===============================
// CARGAR VENTAS
// ===============================
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
  const q = query(ventasRef, orderBy("fecha", "desc"));
  const snap = await getDocs(q);

  snap.forEach(d => {
    const v = d.data();
    const fecha = v.fecha?.toDate();

    if (!fecha) return;

    // CONTADORES
    if (
      fecha.getDate() === ahora.getDate() &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    ) {
      hoy++;
    }

    if (
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    ) {
      mes++;
    }

    // 🔥 AQUÍ ESTÁ LA PARTE IMPORTANTE
    if (v.pagado) {
      pintarHistorial({ ...v, id: d.id });
    } else {
      const li = pintarVenta(d.id, v);
      listaVentas.appendChild(li);
    }
  });

  totalHoyEl.textContent = hoy;
  totalMesEl.textContent = mes;
}

function pintarVenta(id, v) {

  const li = document.createElement("li");
  li.classList.add("card-venta");
  // Aplicar estado guardado al cargar
if (v.estado === "realizado") {
  li.classList.add("estado-realizado");
}

if (v.estado === "pendiente") {
  li.classList.add("estado-pendiente");
}

  
// ====== productos
const productosVenta = v.productos
  ? v.productos
  : [{
      nombre: v.producto,
      cantidad: v.cantidad,
      precioProducto: v.precioProducto,
      precioGrabado: v.precioGrabado
    }];

  let productosHTML = "";
  let totalGeneral = 0;

 productosVenta.forEach(p => {
    const totalProducto =
      p.cantidad * (p.precioProducto + p.precioGrabado);

    totalGeneral += totalProducto;

    productosHTML += `
      <div class="producto-item">
        <div class="producto-nombre">
          ${p.nombre} x${p.cantidad}
        </div>
        <div>Producto: $${p.precioProducto}</div>
        <div>Grabado: $${p.precioGrabado}</div>
        <div class="producto-total">
          Sub total: $${totalProducto.toFixed(2)}
        </div>
      </div>
    `;
  });

  li.innerHTML = `
    <div class="venta-contenido">

      <div class="venta-header">
        <div class="cliente-nombre">
  ${v.cliente || ""}
  ${v.nota ? '<span class="nota-indicador">📝</span>' : ''}
</div>

        <div class="venta-total-general">
          Total: $${totalGeneral.toFixed(2)}
        </div>
      </div>

      <div class="productos-container">
        ${productosHTML}
      </div>
    </div>

    <div class="acciones">
      <button class="btn-pagado">Pagado</button>
      <button class="btn-editar">Editar</button>
      <button class="btn-nota">Nota</button>


<div class="dropdown">
  <button class="btn-estado">Estado</button>

  <div class="estado-menu">
    <button class="pendiente">Pendiente</button>
    <button class="realizado">Realizado</button>
    <button class="eliminar">Eliminar</button>
  </div>
</div>
    </div>
  `;

  // ===============================
  // EVENTOS (DENTRO DE LA FUNCIÓN)
  // ===============================

  li.querySelector(".btn-pagado").onclick = async () => {
    await updateDoc(doc(db, `usuarios/${userId}/ventas/${id}`), {
      pagado: true
    });
    cargarVentas();
  };

  li.querySelector(".btn-editar").onclick = () => {

  ventaEditandoId = id;

  document.querySelectorAll(".vista").forEach(v => v.style.display = "none");
  document.getElementById("vistaVentas").style.display = "block";

  clienteInput.value = v.cliente || "";
  productos = v.productos ? [...v.productos] : [];

  renderProductos();
  calcularTotal();

  window.scrollTo({ top: 0, behavior: "smooth" });
};
const btnNota = li.querySelector(".btn-nota");

if (v.nota) {
  btnNota.classList.add("tiene-nota");
}

btnNota.onclick = () => {
  abrirNota(id, v.nota || "");
};



li.querySelector(".pendiente").onclick = async (e) => {
  e.stopPropagation();

  await updateDoc(doc(db, `usuarios/${userId}/ventas/${id}`), {
    estado: "pendiente"
  });

  li.classList.remove("estado-realizado");
  li.classList.add("estado-pendiente");

  menu.classList.remove("active");
};

li.querySelector(".realizado").onclick = async (e) => {
  e.stopPropagation();

  await updateDoc(doc(db, `usuarios/${userId}/ventas/${id}`), {
    estado: "realizado"
  });

  li.classList.remove("estado-pendiente");
  li.classList.add("estado-realizado");

  menu.classList.remove("active");
};


  li.querySelector(".eliminar").onclick = async () => {
    if (!confirm("¿Eliminar esta venta?")) return;
    await deleteDoc(doc(db, `usuarios/${userId}/ventas/${id}`));
    cargarVentas();
  };

const btnEstado = li.querySelector(".btn-estado");
const menu = li.querySelector(".estado-menu");

btnEstado.onclick = (e) => {
  e.stopPropagation();

  document.querySelectorAll(".estado-menu").forEach(m => {
    if (m !== menu) m.classList.remove("active");
  });

  menu.classList.toggle("active");
};

menu.onclick = (e) => e.stopPropagation();

  return li; // ✅ SOLO UNA VEZ Y AL FINAL
}


function pintarHistorial(v) {

  const card = document.createElement("div");
  card.classList.add("card-historial");

  // 🔹 Calcular total correctamente
  let totalGeneral = 0;

  const productosVenta = v.productos || [];

  let productosHTML = "";

  productosVenta.forEach(p => {
    const totalProducto =
      p.cantidad * (p.precioProducto + p.precioGrabado);

    totalGeneral += totalProducto;

    productosHTML += `
      <div class="producto-historial">
        <strong>${p.nombre} x${p.cantidad}</strong>
        <div>Producto: $${p.precioProducto}</div>
        <div>Grabado: $${p.precioGrabado}</div>
        <div><b>Subtotal: $${totalProducto.toFixed(2)}</b></div>
      </div>
    `;
  });

  card.innerHTML = `
    <div class="historial-header">
      <h3>${v.cliente}</h3>
      <h3>Total: $${totalGeneral.toFixed(2)}</h3>
    </div>

<div class="productos-container">
  ${productosHTML}
</div>

    <div class="historial-botones">
      <button class="btn-deshacer">Deshacer</button>
      <button class="btn-eliminar">Eliminar</button>
    </div>
  `;

  // 🔹 DESHACER (quitar pagado)
  card.querySelector(".btn-deshacer").onclick = async () => {
    await updateDoc(
      doc(db, `usuarios/${userId}/ventas/${v.id}`),
      { pagado: false }
    );
    cargarVentas();
  };

  // 🔹 ELIMINAR
  card.querySelector(".btn-eliminar").onclick = async () => {
    if (!confirm("¿Eliminar esta venta?")) return;

    await deleteDoc(
      doc(db, `usuarios/${userId}/ventas/${v.id}`)
    );

    cargarVentas();
  };

  listaHistorial.appendChild(card);
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
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
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

document.querySelectorAll(".estado-menu").forEach(m => {
  m.classList.remove("active");
});



// ===============================
// MODAL NOTA (SE CREA UNA VEZ)
// ===============================

document.body.insertAdjacentHTML("beforeend", `
  <div id="modalNota" class="nota-overlay">
    <div class="nota-carta">
      <h3>Nota del pedido</h3>

      <textarea id="notaTexto"
        placeholder="Escribe cualquier nota..."></textarea>

      <div class="nota-actions">
        <button id="btnCancelarNota">Cancelar</button>
        <button id="btnGuardarNota" class="guardar">Guardar</button>
      </div>
    </div>
  </div>
`);

const modalNota = document.getElementById("modalNota");
const notaTexto = document.getElementById("notaTexto");
const btnCancelarNota = document.getElementById("btnCancelarNota");
const btnGuardarNota = document.getElementById("btnGuardarNota");

window.abrirNota = function (id, notaActual) {
  ventaNotaActual = id;
  notaTexto.value = notaActual || "";
  modalNota.classList.add("active");
};

btnCancelarNota.onclick = () => {
  modalNota.classList.remove("active");
};

btnGuardarNota.onclick = async () => {
  if (!ventaNotaActual) return;

  await updateDoc(
    doc(db, `usuarios/${userId}/ventas/${ventaNotaActual}`),
    { nota: notaTexto.value }
  );

  modalNota.classList.remove("active");
  cargarVentas();
};










