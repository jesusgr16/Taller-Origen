const lista = document.getElementById("lista");

function guardar() {
  const cliente = document.getElementById("cliente").value;
  const producto = document.getElementById("producto").value;

  if (!cliente || !producto) {
    alert("Completa todos los campos");
    return;
  }

  const venta = { cliente, producto, fecha: new Date() };

  // 🔹 Guardar local
  let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
  ventas.push(venta);
  localStorage.setItem("ventas", JSON.stringify(ventas));

  // 🔥 Guardar en Firestore (FORMA CORRECTA)
  window.addDoc(
    window.collection(window.db, "ventas"),
    venta
  )
  .then(() => console.log("🔥 Guardado en Firestore"))
  .catch(err => console.error("❌ Error Firestore:", err));

  mostrar(venta);

  document.getElementById("cliente").value = "";
  document.getElementById("producto").value = "";
}

function mostrar(venta) {
  const li = document.createElement("li");
  li.textContent = `${venta.cliente} - ${venta.producto}`;
  lista.appendChild(li);
}

window.onload = () => {
  let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
  ventas.forEach(mostrar);
};

// 🔥 SERVICE WORKER (para GitHub Pages)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log("✅ Service Worker activo"))
    .catch(err => console.error("❌ SW error", err));
}

let userId = null;

onAuthStateChanged(auth, user => {
  if (user) {
    userId = user.uid;
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    cargarVentas();
  } else {
    document.getElementById("login").style.display = "block";
    document.getElementById("app").style.display = "none";
  }
});

function registrar() {
  const email = emailInput.value;
  const password = passwordInput.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => console.log("Usuario creado"))
    .catch(err => alert(err.message));
}

function login() {
  const email = emailInput.value;
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => console.log("Sesión iniciada"))
    .catch(err => alert(err.message));
}

function logout() {
  signOut(auth);
}

