console.log("AUTH:", window.auth);
console.log("DB:", window.db);
// ===============================
// VARIABLES
// ===============================
const lista = document.getElementById("lista");
const clienteInput = document.getElementById("cliente");
const productoInput = document.getElementById("producto");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

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
// GUARDAR VENTA (POR USUARIO)
// ===============================
function guardar() {
  if (!userId) {
    alert("Debes iniciar sesión");
    return;
  }

  const cliente = clienteInput.value;
  const producto = productoInput.value;

  if (!cliente || !producto) {
    alert("Completa todos los campos");
    return;
  }

  const venta = {
    cliente,
    producto,
    fecha: new Date()
  };

  // 🔥 Guardar en Firestore por usuario
  addDoc(collection(db, `usuarios/${userId}/ventas`), venta)
    .then(() => console.log("☁️ Venta guardada en Firebase"))
    .catch(err => console.error("❌ Error Firebase:", err));

  mostrar(venta);

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
// CARGAR HISTORIAL DESDE FIREBASE
// ===============================
async function cargarVentas() {
  lista.innerHTML = "";

  const snapshot = await getDocs(
    collection(db, `usuarios/${userId}/ventas`)
  );

  snapshot.forEach(doc => {
    mostrar(doc.data());
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

