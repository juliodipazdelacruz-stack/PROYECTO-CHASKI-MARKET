/* ==========================================================================
   CHASKI MARKET - script.js
   Funciona en TODAS las páginas (index, abarrotes, lacteos, etc.)
   Todo bloque verifica que el elemento exista antes de usarlo.
   ========================================================================== */

// ---------- Utilidades de almacenamiento (localStorage) ----------
const CLAVE_CARRITO  = 'chaski_carrito';
const CLAVE_USUARIOS = 'chaski_usuarios';
const CLAVE_SESION   = 'chaski_sesion';

function leerLS(clave, defecto) {
    try {
        const valor = localStorage.getItem(clave);
        return valor ? JSON.parse(valor) : defecto;
    } catch (e) {
        return defecto;
    }
}

function guardarLS(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch (e) { /* almacenamiento no disponible */ }
}

function formatoSoles(numero) {
    return 'S/ ' + numero.toFixed(2);
}

// ---------- Estado global ----------
let carrito = leerLS(CLAVE_CARRITO, []);
if (!Array.isArray(carrito)) carrito = [];

// ==========================================================================
// 1. MENÚ RESPONSIVO (hamburguesa)
// ==========================================================================
function accion() {
    const menuCategorias = document.querySelector('.dropdown');
    if (menuCategorias) {
        menuCategorias.classList.toggle('menu-abierto');
    }
}

// ==========================================================================
// 2. NOTIFICACIÓN EMERGENTE (reemplaza al alert)
// ==========================================================================
function mostrarToast(mensaje, tipo) {
    const toast = document.createElement('div');
    toast.className = 'toast-chaski' + (tipo === 'error' ? ' toast-error' : '');
    toast.textContent = mensaje;
    document.body.appendChild(toast);

    // pequeño retraso para que se aplique la transición CSS
    setTimeout(() => toast.classList.add('mostrar'), 20);
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.remove(), 400);
    }, 2600);
}

// ==========================================================================
// 3. CARRITO DE COMPRAS
// ==========================================================================
function agregarAlCarrito(btnElement) {
    const tarjeta = btnElement.closest('.tarjeta-producto');
    if (!tarjeta) return;

    const inputCant = tarjeta.querySelector('.input-cantidad');
    const cantidad = inputCant ? (parseInt(inputCant.value) || 1) : 1;

    const nombreEl = tarjeta.querySelector('h3');
    const marcaEl  = tarjeta.querySelector('.marca-producto');
    const precioEl = tarjeta.querySelector('.precio');
    const imgEl    = tarjeta.querySelector('.contenedor-img-producto img');

    const nombre = nombreEl ? nombreEl.textContent.trim() : 'Producto';
    const marca  = marcaEl ? marcaEl.textContent.trim() : '';
    const precio = precioEl ? (parseFloat(precioEl.textContent.replace(/[^\d.]/g, '')) || 0) : 0;
    const img    = imgEl ? imgEl.getAttribute('src') : '';
    const id     = (marca + '|' + nombre).toLowerCase();

    const existente = carrito.find(item => item.id === id);
    if (existente) {
        existente.cant += cantidad;
    } else {
        carrito.push({ id: id, nombre: nombre, marca: marca, precio: precio, img: img, cant: cantidad });
    }

    guardarLS(CLAVE_CARRITO, carrito);
    renderCarrito();
    if (inputCant) inputCant.value = 1;
    mostrarToast('✔ ' + cantidad + ' × ' + nombre + ' agregado al carrito');
}

// Control de botones (+) y (-) del catálogo
function cambiarCantidad(btn, cambio) {
    const contenedor = btn.parentElement;
    if (!contenedor) return;

    const input = contenedor.querySelector('.input-cantidad');
    if (!input) return;

    let valorActual = parseInt(input.value) || 1;
    valorActual += cambio;
    if (valorActual < 1) valorActual = 1;
    input.value = valorActual;
}

function totalItems() {
    return carrito.reduce((suma, item) => suma + item.cant, 0);
}

function totalPrecio() {
    return carrito.reduce((suma, item) => suma + item.precio * item.cant, 0);
}

function renderCarrito() {
    // Contador del ícono
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.textContent = totalItems();

    // Lista dentro del panel
    const lista = document.getElementById('carritoItems');
    const totalEl = document.getElementById('carritoTotal');
    if (!lista) return;

    lista.innerHTML = '';

    if (carrito.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'carrito-vacio';
        vacio.innerHTML = '<i class="fa-solid fa-basket-shopping"></i><p>Tu carrito está vacío.<br>¡Agrega tus productos favoritos!</p>';
        lista.appendChild(vacio);
    } else {
        carrito.forEach(item => {
            const fila = document.createElement('div');
            fila.className = 'carrito-item';
            fila.dataset.id = item.id;

            const imagen = document.createElement('img');
            imagen.src = item.img;
            imagen.alt = item.nombre;

            const info = document.createElement('div');
            info.className = 'carrito-item-info';

            const marca = document.createElement('span');
            marca.className = 'carrito-item-marca';
            marca.textContent = item.marca;

            const nombre = document.createElement('h4');
            nombre.textContent = item.nombre;

            const precio = document.createElement('span');
            precio.className = 'carrito-item-precio';
            precio.textContent = formatoSoles(item.precio * item.cant);

            const controles = document.createElement('div');
            controles.className = 'carrito-item-controles';
            controles.innerHTML =
                '<button data-accion="restar" aria-label="Restar">-</button>' +
                '<span class="carrito-item-cant">' + item.cant + '</span>' +
                '<button data-accion="sumar" aria-label="Sumar">+</button>' +
                '<button data-accion="quitar" class="btn-quitar" aria-label="Quitar"><i class="fa-solid fa-trash-can"></i></button>';

            info.appendChild(marca);
            info.appendChild(nombre);
            info.appendChild(precio);
            info.appendChild(controles);

            fila.appendChild(imagen);
            fila.appendChild(info);
            lista.appendChild(fila);
        });
    }

    if (totalEl) totalEl.textContent = formatoSoles(totalPrecio());
}

function modificarItem(id, accionItem) {
    const indice = carrito.findIndex(item => item.id === id);
    if (indice === -1) return;

    if (accionItem === 'sumar') {
        carrito[indice].cant += 1;
    } else if (accionItem === 'restar') {
        carrito[indice].cant -= 1;
        if (carrito[indice].cant < 1) carrito.splice(indice, 1);
    } else if (accionItem === 'quitar') {
        carrito.splice(indice, 1);
    }

    guardarLS(CLAVE_CARRITO, carrito);
    renderCarrito();
}

function vaciarCarrito() {
    carrito = [];
    guardarLS(CLAVE_CARRITO, carrito);
    renderCarrito();
}

function finalizarCompra() {
    if (carrito.length === 0) {
        mostrarToast('Tu carrito está vacío.', 'error');
        return;
    }

    const sesion = leerLS(CLAVE_SESION, null);
    if (!sesion) {
        cerrarCarrito();
        abrirCuenta('login');
        mostrarToast('Inicia sesión para finalizar tu compra.', 'error');
        return;
    }

    const total = totalPrecio();
    vaciarCarrito();
    cerrarCarrito();
    mostrarToast('🎉 ¡Gracias, ' + sesion.nombre.split(' ')[0] + '! Pedido registrado por ' + formatoSoles(total));
}

// ---------- Apertura / cierre del panel ----------
function abrirCarrito() {
    cerrarCuenta();
    const panel = document.getElementById('carritoPanel');
    const overlay = document.getElementById('overlayChaski');
    if (panel) panel.classList.add('abierto');
    if (overlay) overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function cerrarCarrito() {
    const panel = document.getElementById('carritoPanel');
    if (panel) panel.classList.remove('abierto');
    cerrarOverlay();
}

function cerrarOverlay() {
    const panelAbierto = document.querySelector('.carrito-panel.abierto');
    const modalAbierto = document.querySelector('.modal-cuenta.abierto');
    if (!panelAbierto && !modalAbierto) {
        const overlay = document.getElementById('overlayChaski');
        if (overlay) overlay.classList.remove('visible');
        document.body.style.overflow = '';
    }
}

// ==========================================================================
// 4. MI CUENTA (registro e inicio de sesión simulados con localStorage)
// ==========================================================================
function usuarioActual() {
    return leerLS(CLAVE_SESION, null);
}

function actualizarEtiquetaCuenta() {
    const etiqueta = document.querySelector('.nav-acciones .nav-enlace .texto-accion-escritorio');
    if (!etiqueta) return;
    const sesion = usuarioActual();
    etiqueta.textContent = sesion ? sesion.nombre.split(' ')[0] : 'Mi Cuenta';
}

function abrirCuenta(vista) {
    cerrarCarrito();
    const modal = document.getElementById('modalCuenta');
    const overlay = document.getElementById('overlayChaski');
    if (!modal) return;

    renderCuenta(vista || (usuarioActual() ? 'perfil' : 'login'));
    modal.classList.add('abierto');
    if (overlay) overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function cerrarCuenta() {
    const modal = document.getElementById('modalCuenta');
    if (modal) modal.classList.remove('abierto');
    cerrarOverlay();
}

function renderCuenta(vista) {
    const contenido = document.getElementById('cuentaContenido');
    if (!contenido) return;

    if (vista === 'perfil' && usuarioActual()) {
        const sesion = usuarioActual();
        contenido.innerHTML =
            '<div class="perfil-avatar"><i class="fa-solid fa-circle-user"></i></div>' +
            '<h3 class="perfil-nombre"></h3>' +
            '<p class="perfil-correo"></p>' +
            '<p class="perfil-resumen"></p>' +
            '<button class="btn-principal w-100" id="btnVerCarrito">Ver mi carrito</button>' +
            '<button class="btn-vaciar" id="btnCerrarSesion">Cerrar sesión</button>';

        contenido.querySelector('.perfil-nombre').textContent = '¡Hola, ' + sesion.nombre + '!';
        contenido.querySelector('.perfil-correo').textContent = sesion.correo;
        contenido.querySelector('.perfil-resumen').textContent =
            'Tienes ' + totalItems() + ' producto(s) en tu carrito (' + formatoSoles(totalPrecio()) + ').';

        document.getElementById('btnVerCarrito').addEventListener('click', function () {
            cerrarCuenta();
            abrirCarrito();
        });
        document.getElementById('btnCerrarSesion').addEventListener('click', function () {
            try { localStorage.removeItem(CLAVE_SESION); } catch (e) {}
            actualizarEtiquetaCuenta();
            cerrarCuenta();
            mostrarToast('Sesión cerrada. ¡Vuelve pronto!');
        });
        return;
    }

    const esRegistro = (vista === 'registro');

    contenido.innerHTML =
        '<div class="cuenta-tabs">' +
            '<button class="cuenta-tab' + (esRegistro ? '' : ' activa') + '" data-vista="login">Ingresar</button>' +
            '<button class="cuenta-tab' + (esRegistro ? ' activa' : '') + '" data-vista="registro">Crear cuenta</button>' +
        '</div>' +
        '<form class="formulario-moderno" id="formCuenta" novalidate>' +
            (esRegistro
                ? '<div class="grupo-input"><label for="cuentaNombre">Nombre completo</label>' +
                  '<input type="text" id="cuentaNombre" placeholder="Ej. Juan Pérez">' +
                  '<span class="error" id="cuentaNombreError"></span></div>'
                : '') +
            '<div class="grupo-input"><label for="cuentaCorreo">Correo electrónico</label>' +
            '<input type="email" id="cuentaCorreo" placeholder="tucorreo@ejemplo.com">' +
            '<span class="error" id="cuentaCorreoError"></span></div>' +
            '<div class="grupo-input"><label for="cuentaClave">Contraseña</label>' +
            '<input type="password" id="cuentaClave" placeholder="Mínimo 6 caracteres">' +
            '<span class="error" id="cuentaClaveError"></span></div>' +
            '<button type="submit" class="btn-principal w-100">' + (esRegistro ? 'Crear mi cuenta' : 'Ingresar') + '</button>' +
            '<span class="error text-center" id="cuentaGeneralError"></span>' +
        '</form>';

    contenido.querySelectorAll('.cuenta-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            renderCuenta(tab.dataset.vista);
        });
    });

    document.getElementById('formCuenta').addEventListener('submit', function (event) {
        event.preventDefault();
        procesarCuenta(esRegistro);
    });
}

function procesarCuenta(esRegistro) {
    const campoNombre = document.getElementById('cuentaNombre');
    const nombre = campoNombre ? campoNombre.value.trim() : '';
    const correo = document.getElementById('cuentaCorreo').value.trim().toLowerCase();
    const clave  = document.getElementById('cuentaClave').value;

    const errNombre  = document.getElementById('cuentaNombreError');
    const errCorreo  = document.getElementById('cuentaCorreoError');
    const errClave   = document.getElementById('cuentaClaveError');
    const errGeneral = document.getElementById('cuentaGeneralError');

    if (errNombre) errNombre.textContent = '';
    errCorreo.textContent = '';
    errClave.textContent = '';
    errGeneral.textContent = '';

    let valido = true;
    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (esRegistro && nombre.length < 3) {
        errNombre.textContent = 'El nombre debe tener al menos 3 caracteres.';
        valido = false;
    }
    if (!patronCorreo.test(correo)) {
        errCorreo.textContent = 'Ingresa un correo válido.';
        valido = false;
    }
    if (clave.length < 6) {
        errClave.textContent = 'La contraseña debe tener al menos 6 caracteres.';
        valido = false;
    }
    if (!valido) return;

    const usuarios = leerLS(CLAVE_USUARIOS, []);

    if (esRegistro) {
        if (usuarios.some(u => u.correo === correo)) {
            errGeneral.textContent = 'Ese correo ya está registrado. Prueba ingresar.';
            return;
        }
        usuarios.push({ nombre: nombre, correo: correo, clave: clave });
        guardarLS(CLAVE_USUARIOS, usuarios);
        guardarLS(CLAVE_SESION, { nombre: nombre, correo: correo });
        actualizarEtiquetaCuenta();
        cerrarCuenta();
        mostrarToast('¡Cuenta creada! Bienvenido, ' + nombre.split(' ')[0] + '.');
    } else {
        const usuario = usuarios.find(u => u.correo === correo && u.clave === clave);
        if (!usuario) {
            errGeneral.textContent = 'Correo o contraseña incorrectos.';
            return;
        }
        guardarLS(CLAVE_SESION, { nombre: usuario.nombre, correo: usuario.correo });
        actualizarEtiquetaCuenta();
        cerrarCuenta();
        mostrarToast('¡Bienvenido de nuevo, ' + usuario.nombre.split(' ')[0] + '!');
    }
}

// ==========================================================================
// 5. CONSTRUCCIÓN DE LAS VENTANAS (se inyectan por JS en cualquier página)
// ==========================================================================
function crearComponentes() {
    if (document.getElementById('carritoPanel')) return; // ya existen

    const overlay = document.createElement('div');
    overlay.id = 'overlayChaski';
    overlay.className = 'overlay-chaski';
    overlay.addEventListener('click', function () {
        cerrarCarrito();
        cerrarCuenta();
    });

    const panel = document.createElement('aside');
    panel.id = 'carritoPanel';
    panel.className = 'carrito-panel';
    panel.setAttribute('aria-label', 'Carrito de compras');
    panel.innerHTML =
        '<div class="panel-cabecera">' +
            '<h3><i class="fa-solid fa-cart-shopping"></i> Mi carrito</h3>' +
            '<button id="cerrarCarrito" class="btn-cerrar" aria-label="Cerrar carrito">&times;</button>' +
        '</div>' +
        '<div class="panel-cuerpo" id="carritoItems"></div>' +
        '<div class="panel-pie">' +
            '<div class="carrito-total"><span>Total</span><strong id="carritoTotal">S/ 0.00</strong></div>' +
            '<button class="btn-principal w-100" id="btnFinalizar">Finalizar compra</button>' +
            '<button class="btn-vaciar" id="btnVaciar">Vaciar carrito</button>' +
        '</div>';

    const modal = document.createElement('div');
    modal.id = 'modalCuenta';
    modal.className = 'modal-cuenta';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Mi cuenta');
    modal.innerHTML =
        '<div class="modal-caja">' +
            '<button id="cerrarCuenta" class="btn-cerrar" aria-label="Cerrar">&times;</button>' +
            '<div id="cuentaContenido"></div>' +
        '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.body.appendChild(modal);

    document.getElementById('cerrarCarrito').addEventListener('click', cerrarCarrito);
    document.getElementById('cerrarCuenta').addEventListener('click', cerrarCuenta);
    document.getElementById('btnFinalizar').addEventListener('click', finalizarCompra);
    document.getElementById('btnVaciar').addEventListener('click', function () {
        if (carrito.length === 0) return;
        vaciarCarrito();
        mostrarToast('Carrito vaciado.');
    });

    // Botones + / - / quitar de cada producto del carrito (delegación de eventos)
    document.getElementById('carritoItems').addEventListener('click', function (event) {
        const boton = event.target.closest('button[data-accion]');
        if (!boton) return;
        const fila = boton.closest('.carrito-item');
        if (!fila) return;
        modificarItem(fila.dataset.id, boton.dataset.accion);
    });
}

// ==========================================================================
// 6. INICIALIZACIÓN (se ejecuta en cada página)
// ==========================================================================
document.addEventListener('DOMContentLoaded', function () {

    crearComponentes();
    renderCarrito();
    actualizarEtiquetaCuenta();

    // Delegación de eventos: funciona en TODAS las páginas aunque el HTML
    // use id="btnCarrito" o class="btn-carrito" para el carrito.
    document.addEventListener('click', function (event) {
        // Ícono del carrito -> abre el panel
        if (event.target.closest('#btnCarrito, .btn-carrito')) {
            event.preventDefault();
            abrirCarrito();
            return;
        }
        // "Mi Cuenta" -> abre la ventana de cuenta
        if (event.target.closest('.nav-acciones .nav-enlace')) {
            event.preventDefault();
            abrirCuenta();
        }
    });

    // Tecla ESC cierra cualquier ventana
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            cerrarCarrito();
            cerrarCuenta();
        }
    });

    // Validación del formulario de contacto (solo si existe en la página)
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const nombreInput = document.getElementById('nombre');
            const telefonoInput = document.getElementById('telefono');
            const mensajeInput = document.getElementById('mensajeText');

            const nombre = nombreInput ? nombreInput.value.trim() : '';
            const telefono = telefonoInput ? telefonoInput.value.trim() : '';
            const mensajeText = mensajeInput ? mensajeInput.value.trim() : '';

            let isValid = true;

            const nombreError = document.getElementById('nombreError');
            const telefonoError = document.getElementById('telefonoError');
            const mensajeError = document.getElementById('mensajeError');
            const mensajeExito = document.getElementById('mensaje');

            if (nombreError) nombreError.textContent = '';
            if (telefonoError) telefonoError.textContent = '';
            if (mensajeError) mensajeError.textContent = '';
            if (mensajeExito) mensajeExito.textContent = '';

            if (nombre.length < 3) {
                if (nombreError) nombreError.textContent = 'El nombre debe tener al menos 3 caracteres.';
                isValid = false;
            }

            if (telefono.length < 6) {
                if (telefonoError) telefonoError.textContent = 'Ingrese un número de teléfono válido.';
                isValid = false;
            }

            if (mensajeText.length < 4) {
                if (mensajeError) mensajeError.textContent = 'Por favor, ingrese un mensaje o pedido más detallado.';
                isValid = false;
            }

            if (isValid) {
                if (mensajeExito) mensajeExito.textContent = '¡Registro y mensaje enviado con éxito! Bienvenido, ' + nombre + '.';
                registroForm.reset();
            }
        });
    }

    // Búsqueda y filtrado dinámico en vivo en el catálogo
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const tarjetas = document.querySelectorAll('.tarjeta-producto');

            tarjetas.forEach(card => {
                const tituloEl = card.querySelector('h3');
                const marcaEl = card.querySelector('.marca-producto');

                const titulo = tituloEl ? tituloEl.textContent.toLowerCase() : '';
                const marca = marcaEl ? marcaEl.textContent.toLowerCase() : '';

                card.style.display = (titulo.includes(searchTerm) || marca.includes(searchTerm)) ? 'flex' : 'none';
            });
        });
    }
});
