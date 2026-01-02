// ===============================
// VARIABLES
// ===============================
const lista = document.getElementById("lista");
const clienteInput = document.getElementById("cliente");
const productoInput = document.getElementById("producto");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const busquedaInput = document.getElementById("busqueda");

let userId = null;

// ===============================
// AUTH: detectar sesión
// ===============================
onAuthStateChanged(auth, user => {
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
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Completa correo y contraseña");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => console.log("✅ Usuario creado"))
    .catch(err => alert(err.message));
}

// ===============================
// LOGIN
// ===============================
function login() {
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Completa correo y contraseña");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => console.log("✅ Sesión iniciada"))
    .catch(err => alert(err.message));
}

// ===============================
// LOGOUT
// ===============================
function logout() {
  signOut(auth);
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

  try {
    await addDoc(
      collection(db, `usuarios/${userId}/ventas`),
      venta
    );

    mostrar(venta);
    calcularTotales();
  } catch (err) {
    console.error("❌ Error Firebase:", err);
  }

  clienteInput.value = "";
  productoInput.value = "";
}

// ===============================
// MOSTRAR EN PANTALLA
// ===============================
function mostrar(venta) {
  const li = document.createElement("li");
  li.textContent = `${venta.cliente} - ${venta.producto}`;
  lista.appendChild(li);
}

// ===============================
// CARGAR HISTORIAL
// ===============================
async function cargarVentas() {
  lista.innerHTML = "";

  const snapshot = await getDocs(
    collection(db, `usuarios/${userId}/ventas`)
  );

  snapshot.forEach(doc => mostrar(doc.data()));

  calcularTotales();
}

// ===============================
// TOTALES POR DÍA / MES
// ===============================
async function calcularTotales() {
  let hoy = 0;
  let mes = 0;

  const ahora = new Date();
  const diaActual = ahora.toDateString();
  const mesActual = ahora.getMonth();
  const añoActual = ahora.getFullYear();

  const snapshot = await getDocs(
    collection(db, `usuarios/${userId}/ventas`)
  );

  snapshot.forEach(doc => {
    const fecha = doc.data().fecha.toDate
      ? doc.data().fecha.toDate()
      : new Date(doc.data().fecha);

    if (fecha.toDateString() === diaActual) hoy++;

    if (
      fecha.getMonth() === mesActual &&
      fecha.getFullYear() === añoActual
    ) mes++;
  });

  document.getElementById("totalHoy").textContent = hoy;
  document.getElementById("totalMes").textContent = mes;
}

// ===============================
// BÚSQUEDA DE CLIENTES
// ===============================
if (busquedaInput) {
  busquedaInput.addEventListener("input", async () => {
    const texto = busquedaInput.value.toLowerCase();
    lista.innerHTML = "";

    const snapshot = await getDocs(
      collection(db, `usuarios/${userId}/ventas`)
    );

    snapshot.forEach(doc => {
      const venta = doc.data();
      if (venta.cliente.toLowerCase().includes(texto)) {
        mostrar(venta);
      }
    });
  });
}

// ===============================
// SERVICE WORKER
// ===============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js")
    .then(() => console.log("✅ Service Worker activo"))
    .catch(err => console.error("❌ SW error", err));
}
