const lista = document.getElementById("lista");

function guardar() {
  const cliente = document.getElementById("cliente").value;
  const producto = document.getElementById("producto").value;

  if (!cliente || !producto) {
    alert("Completa todos los campos");
    return;
  }

  const venta = { cliente, producto, fecha: new Date() };

  // 🔹 Guardar local (respaldo rápido)
  let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
  ventas.push(venta);
  localStorage.setItem("ventas", JSON.stringify(ventas));

  // 🔹 Guardar en Firebase (respaldo nube)
  addDoc(collection(db, "ventas"), venta)
    .then(() => console.log("Guardado en la nube"))
    .catch(err => console.error(err));

  mostrar(venta);

  document.getElementById("cliente").value = "";
  document.getElementById("producto").value = "";
}

function mostrar(venta) {
  const li = document.createElement("li");
  li.textContent = `${venta.cliente} - ${venta.producto}`;
  lista.appendChild(li);
}

// 🔹 Cargar respaldo local
window.onload = () => {
  let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
  ventas.forEach(mostrar);
};
