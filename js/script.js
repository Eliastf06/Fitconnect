// Importa createClient directamente desde el CDN como un módulo
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Tus credenciales de Supabase
const SUPABASE_URL = 'https://auozbjnxzvttkarghgxc.supabase.co'; // Tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b3piam54enZ0dGthcmdoZ3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDE0MTAsImV4cCI6MjA2NzA3NzQxMH0.nDsQhmF_kwRSUO168CDmdica6OoMN3XMSzXucyr0yDg'; // Tu Anon Key

// Inicializa el cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TODO EL CÓDIGO RESTANTE DEBE IR DENTRO DE ESTE BLOQUE DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM (botones desktop)
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const loggedInActions = document.getElementById('logged-in-actions'); // Contenedor de botones de desktop
    const profileButton = document.getElementById('profile-button');
    const logoutButton = document.getElementById('logout-button');

    // Referencias a los elementos del DOM (menú móvil)
    const hamburgerButton = document.getElementById('hamburger-button');
    const mobileMenu = document.getElementById('mobile-menu'); // Esto es .link-bar-3 ahora con ID

    const loggedInActionsMobile = document.getElementById('logged-in-actions-mobile');
    const loggedOutActionsMobile = document.getElementById('logged-out-actions-mobile');
    const profileLinkMobile = document.getElementById('profile-link-mobile');
    const logoutLinkMobile = document.getElementById('logout-link-mobile');
    const loginLinkMobile = document.getElementById('login-link-mobile');
    const registerLinkMobile = document.getElementById('register-link-mobile');


    // Función para actualizar la UI según el estado de autenticación
    async function updateAuthUI(session) {
        if (session) {
            // --- Lógica para desktop (botones en la barra de acciones) ---
            loginButton.style.display = 'none';
            registerButton.style.display = 'none';
            loggedInActions.style.display = 'flex'; // Mostrar los botones de perfil y cerrar sesión en desktop

            // Actualizar el texto del botón de perfil si tienes el nombre de usuario
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const userName = user.user_metadata?.username || user.email;
                profileButton.textContent = `Hola, ${userName.split('@')[0]}`;
                profileLinkMobile.textContent = `Hola, ${userName.split('@')[0]}`; // También para el menú móvil
            }

            profileButton.onclick = () => {
                window.location.href = 'profile.html';
            };

            logoutButton.onclick = async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Error al cerrar sesión:', error.message);
                    alert('Error al cerrar sesión. Inténtalo de nuevo.');
                } else {
                    console.log('Sesión cerrada exitosamente.');
                    alert('Has cerrado sesión.');
                }
            };

            // --- Lógica para el menú móvil (enlaces dentro del desplegable) ---
            loggedInActionsMobile.style.display = 'flex'; // Mostrar los enlaces de sesión iniciada
            loggedOutActionsMobile.style.display = 'none'; // Ocultar los enlaces de no sesión iniciada

            profileLinkMobile.onclick = () => {
                window.location.href = 'profile.html';
            };

            logoutLinkMobile.onclick = async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Error al cerrar sesión:', error.message);
                    alert('Error al cerrar sesión. Inténtalo de nuevo.');
                } else {
                    console.log('Sesión cerrada exitosamente.');
                    alert('Has cerrado sesión.');
                }
            };


        } else {
            // --- Lógica para desktop (botones en la barra de acciones) ---
            loginButton.style.display = 'block';
            registerButton.style.display = 'block';
            loggedInActions.style.display = 'none'; // Ocultar los botones de perfil y cerrar sesión

            // --- Lógica para el menú móvil (enlaces dentro del desplegable) ---
            loggedInActionsMobile.style.display = 'none'; // Ocultar los enlaces de sesión iniciada
            loggedOutActionsMobile.style.display = 'flex'; // Mostrar los enlaces de no sesión iniciada

            loginLinkMobile.onclick = () => {
                window.location.href = 'signin.html';
            };

            registerLinkMobile.onclick = () => {
                window.location.href = 'regis.html';
            };
        }
    }

    // Escuchar cambios en el estado de autenticación de Supabase
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event, 'Session:', session);
        updateAuthUI(session);
    });

    // Comprobar el estado inicial de autenticación al cargar la página
    (async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            updateAuthUI(session);
        } catch (error) {
            console.error("Error al obtener la sesión inicial:", error);
            updateAuthUI(null);
        }
    })();

    // Lógica para el menú hamburguesa
    hamburgerButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        hamburgerButton.classList.toggle('active'); // Para la animación de la X
    });

    // Cerrar el menú si se hace clic en un enlace (incluye los nuevos enlaces de perfil/logout/login/register)
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            hamburgerButton.classList.remove('active');
        });
    });
});