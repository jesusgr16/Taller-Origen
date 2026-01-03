// ===============================
// FIREBASE DESDE WINDOW
// ===============================
const auth = window.auth;
const db = window.db;

// ===============================
// VARIABLES DOM
// ===============================
const lista = document.getElementById("lista");
const clienteInput = document.getElementById("cliente");
const productoInput = document.getElementById("producto");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const busquedaInput = document.getElementById("busqueda");

let userId = null;

// ===============================
// AUTH STATE
// ===============================
window.onAuthStateChanged(auth, user => {
  if (user) {
    userId = user.uid;

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    cargarVentas();
  } else {
    userId = null;

    document.getElementById("login").style.display = "block";
    document.getElementById("app").style.display = "none";

    lista.innerHTML = "";
  }
});

// ===============================
// REGISTRO
// ===============================
function registrar() {
  if (!emailInput.value || !passwordInput.value) {
    alert("Completa correo y contraseña");
    return;
  }

  window.createUserWithEmailAndPassword(
    auth,
    emailInput.value,
    passwordInput.value
  )
    .then(() => console.log("✅ Usuario creado"))
    .catch(err => alert(err.message));
}

// ===============================
// LOGIN
// ===============================
function login() {
  if (!emailInput.value || !passwordInput.value) {
    alert("Completa correo y contraseña");
    return;
  }

  window.signInWithEmailAndPassword(
    auth,
    emailInput.value,
    passwordInput.value
  )
    .then(() => console.log("✅ Sesión iniciada"))
    .catch(err => alert(err.message));
}

// ===============================
// LOGOUT
// ===============================
function logout() {
  window.signOut(auth);
}

// ===============================
// GUARDAR VENTA
// ===============================
async function guardar() {
  if (!userId) {
    alert("Debes iniciar sesión");
    return;
  }

  const cliente = clienteInput.value.trim();
  const producto = productoInput.value.trim();

  if (!cliente || !producto) {
    alert("Completa todos los campos");
    return;
  }

  const venta = {
    cliente,
    producto,
    fecha: new Date()
  };

  await window.addDoc(
    window.collection(db, `usuarios/${userId}/ventas`),
    venta
  );

  mostrar(venta);
  calcularTotales();

  clienteInput.value = "";
  productoInput.value = "";
}

// ===============================
// MOSTRAR
// ===============================
function mostrar(venta) {
  const li = document.createElement("li");
  li.textContent = `${venta.cliente} - ${venta.producto}`;
  lista.appendChild(li);
}

// ===============================
// CARGAR VENTAS
// ===============================
async function cargarVentas() {
  lista.innerHTML = "";

  const snapshot = await window.getDocs(
    window.collection(db, `usuarios/${userId}/ventas`)
  );

  snapshot.forEach(doc => mostrar(doc.data()));
  calcularTotales();
}

// ===============================
// TOTALES
// ===============================
async function calcularTotales() {
  let hoy = 0;
  let mes = 0;
  const ahora = new Date();

  const snapshot = await window.getDocs(
    window.collection(db, `usuarios/${userId}/ventas`)
  );

  snapshot.forEach(doc => {
    const fecha = doc.data().fecha.toDate
      ? doc.data().fecha.toDate()
      : new Date(doc.data().fecha);

    if (fecha.toDateString() === ahora.toDateString()) hoy++;
    if (
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    ) mes++;
  });

  document.getElementById("totalHoy").textContent = hoy;
  document.getElementById("totalMes").textContent = mes;
}

// ===============================
// BUSQUEDA
// ===============================
if (busquedaInput) {
  busquedaInput.addEventListener("input", async () => {
    const texto = busquedaInput.value.toLowerCase();
    lista.innerHTML = "";

    const snapshot = await window.getDocs(
      window.collection(db, `usuarios/${userId}/ventas`)
    );

    snapshot.forEach(doc => {
      const venta = doc.data();
      if (venta.cliente.toLowerCase().includes(texto)) {
        mostrar(venta);
      }
    });
  });
}
