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
btnRegister.addEventListener("click", () => {
  window.createUserWithEmailAndPassword(
    auth,
    emailInput.value,
    passwordInput.value
  ).then(() => console.log("✅ Usuario creado"))
   .catch(err => alert(err.message));
});

btnLogin.addEventListener("click", () => {
  window.signInWithEmailAndPassword(
    auth,
    emailInput.value,
    passwordInput.value
  ).then(() => console.log("✅ Sesión iniciada"))
   .catch(err => alert(err.message));
});

btnLogout.addEventListener("click", () => {
  window.signOut(auth);
});

btnGuardar.addEventListener("click", () => guardar());

// ===============================
// FIRESTORE
// ===============================
function guardar() {
  if (!userId) return alert("Inicia sesión");

  const venta = {
    cliente: clienteInput.value,
    producto: productoInput.value,
    fecha: new Date()
  };

  window.addDoc(
    window.collection(db, `usuarios/${userId}/ventas`),
    venta
  );

  mostrar(venta);

  clienteInput.value = "";
  productoInput.value = "";
}

function mostrar(venta) {
  const li = document.createElement("li");
  li.textContent = `${venta.cliente} - ${venta.producto}`;
  lista.appendChild(li);
}

async function cargarVentas() {
  lista.innerHTML = "";
  const snap = await window.getDocs(
    window.collection(db, `usuarios/${userId}/ventas`)
  );
  snap.forEach(doc => mostrar(doc.data()));
}
