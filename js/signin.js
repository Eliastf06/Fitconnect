// Importa createClient directamente desde el CDN como un módulo
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Tus credenciales de Supabase (las mismas que usaste para regis.js)
const SUPABASE_URL = 'https://auozbjnxzvttkarghgxc.supabase.co'; // Tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b3piam54enZ0dGthcmdoZ3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDE0MTAsImV4cCI6MjA2NzA3NzQxMH0.nDsQhmF_kwRSUO168CDmdica6OoMN3XMSzXucyr0yDg'; // Tu Anon Key

// Inicializa el cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TODO EL CÓDIGO RESTANTE DEBE IR DENTRO DE ESTE BLOQUE DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

    // Referencias a los elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const appMessageElement = document.getElementById('app-message');
    const forgotPasswordLink = document.getElementById('forgot-password');

    // Inputs del formulario de login
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Función para mostrar mensajes al usuario
    function showMessage(message, type = 'success') {
        appMessageElement.textContent = message;
        appMessageElement.style.color = type === 'success' ? 'green' : 'red';
        appMessageElement.style.display = 'block';
        setTimeout(() => {
            appMessageElement.style.display = 'none';
        }, 5000);
    }

    // ======================================
    // MANEJO DEL INICIO DE SESIÓN con Supabase
    // ======================================
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showMessage('Por favor, ingresa tu email y contraseña.', 'error');
            return;
        }

        showMessage('Iniciando sesión...', 'black'); // Mensaje de carga

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Error al iniciar sesión:', error);
                if (error.message.includes('Invalid login credentials')) {
                    showMessage('Credenciales incorrectas. Verifica tu email y contraseña.', 'error');
                } else if (error.message.includes('Email not confirmed')) {
                    showMessage('Tu email no ha sido confirmado. Revisa tu bandeja de entrada o spam.', 'error');
                } else {
                    showMessage(`Error al iniciar sesión: ${error.message}`, 'error');
                }
                return;
            }

            if (data.user) {
                // Si tienes metadatos como 'username', puedes acceder a ellos aquí
                const username = data.user.user_metadata?.username || data.user.email;
                showMessage(`¡Inicio de sesión exitoso! Bienvenido, ${username}!`, 'success');
                console.log('Usuario logueado:', data.user);
                // Redirigir al usuario a la página principal o al dashboard
                window.location.href = 'index.html'; // Asegúrate de tener un 'index.html' o la página a la que quieras redirigir
                loginForm.reset();
            } else {
                showMessage('No se pudo iniciar sesión. Verifica tus credenciales.', 'error');
            }

        } catch (err) {
            console.error('Error inesperado al iniciar sesión:', err);
            showMessage('Ocurrió un error inesperado durante el inicio de sesión.', 'error');
        }
    });

    // ======================================
    // Manejo de "Olvidé mi contraseña"
    // ======================================
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = prompt("Por favor, ingresa tu email para restablecer la contraseña:");
        if (!email) {
            showMessage("Restablecimiento de contraseña cancelado.", "error");
            return;
        }

        showMessage("Enviando enlace de restablecimiento...", "black");
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                // Asegúrate de que esta URL de redirección exista en tu proyecto o se adapte a tu flujo
                redirectTo: window.location.origin + '/update-password.html' // O tu página para actualizar la contraseña
            });
            if (error) {
                console.error("Error al enviar restablecimiento:", error);
                showMessage(`Error al enviar restablecimiento: ${error.message}`, "error");
            } else {
                showMessage("Se ha enviado un enlace para restablecer tu contraseña a tu email. Revisa tu bandeja de entrada y la carpeta de spam.", "success");
            }
        } catch (err) {
            console.error("Error inesperado al restablecer:", err);
            showMessage("Ocurrió un error inesperado al restablecer la contraseña.", "error");
        }
    });

    // Opcional: Comprobar el estado de autenticación al cargar la página
    // Esto podría usarse para redirigir automáticamente si el usuario ya está logueado
    (async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log("Usuario ya autenticado:", user);
                const username = user.user_metadata?.username || user.email;
                showMessage(`Bienvenido de nuevo, ${username}! Ya estás conectado.`, 'success');
                // Si el usuario ya está autenticado, puedes redirigirlo a otra página
                // window.location.href = 'index.html';
            }
        } catch (error) {
            console.error("Error al obtener el estado de autenticación:", error);
        }
    })();
});