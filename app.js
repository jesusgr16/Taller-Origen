// ===============================
// ESPERAR A FIREBASE
// ===============================
const auth = window.auth;
const db = window.db;

console.log("AUTH:", auth);
console.log("DB:", db);

// ===============================
// ELEMENTOS
// ===============================
const loginDiv = document.getElementById("login");
const appDiv = document.getElementById("app");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const clienteInput = document.getElementById("cliente");
const productoInput = document.getElementById("producto");
const lista = document.getElementById("lista");

const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const btnGuardar = document.getElementById("btnGuardar");
const btnLogout = document.getElementById("btnLogout");

let userId = null;

// ===============================
// AUTH STATE
// ===============================
window.onAuthStateChanged(auth, user => {
  if (user) {
    userId = user.uid;

    loginDiv.style.display = "none";
    appDiv.style.display = "block";

    cargarVentas();
  } else {
    userId = null;

    loginDiv.style.display = "block";
    appDiv.style.display = "none";

    lista.innerHTML = "";
  }
});

// ===============================
// EVENTOS
// ===============================
btnRegister.addEventListener("click", async () => {
  try {
    await window.createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    console.log("✅ Usuario creado");
  } catch (err) {
    alert(err.message);
  }
});

btnLogin.addEventListener("click", async () => {
  try {
    await window.signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    console.log("✅ Sesión iniciada");
  } catch (err) {
    alert(err.message);
  }
});

btnLogout.addEventListener("click", () => {
  window.signOut(auth);
});

btnGuardar.addEventListener("click", guardar);

// ===============================
// FIRESTORE
// ===============================
async function guardar() {
  if (!userId) {
    alert("Inicia sesión");
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
    await window.addDoc(
      window.collection(db, `usuarios/${userId}/ventas`),
      venta
    );

    console.log("☁️ Venta guardada en Firebase");
    mostrar(venta);
  } catch (err) {
    console.error("❌ Error Firebase:", err);
  }

  clienteInput.value = "";
  productoInput.value = "";
}

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

  const snap = await window.getDocs(
    window.collection(db, `usuarios/${userId}/ventas`)
  );

  snap.forEach(doc => {
    mostrar(doc.data());
  });
}
