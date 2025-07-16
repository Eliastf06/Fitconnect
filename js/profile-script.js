// js/profile-script.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ¡IMPORTANTE! Tus credenciales de Supabase.
const SUPABASE_URL = 'https://auozbjnxzvttkarghgxc.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b3piam54enZ0dGthcmdoZ3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDE0MTAsImV4cCI6MjA2NzA3NzQxMH0.nDsQhmF_kwRSUO168CDmdica6OoMN3XMSzXucyr0yDg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Referencias a los elementos del DOM que maneja este script ---
const userNameElement = document.getElementById('userName');
const userMailElement = document.getElementById('userMail');
const userPicElement = document.querySelector('.profile-pic');
// Nueva referencia al botón de volver
const backButton = document.getElementById('backButton'); // <--- AÑADIDO

async function loadUserProfile() {
    console.log('profile-script.js: Iniciando carga de perfil de usuario...');
    // Establecer estados de carga iniciales
    if (userNameElement) userNameElement.innerHTML = `Cargando... <i class="fas fa-spinner fa-spin"></i>`;
    if (userMailElement) userMailElement.textContent = 'Cargando...';
    if (userPicElement) userPicElement.src = 'http://googleusercontent.com/file_content/2'; // Default cargando

    try {
        // 1. Obtener el usuario autenticado desde Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            throw authError;
        }

        if (!user) {
            // Si no hay usuario autenticado
            console.warn('profile-script.js: No hay usuario autenticado.');
            if (userNameElement) userNameElement.innerHTML = `No Logeado <i class="fas fa-exclamation-circle"></i>`;
            if (userMailElement) userMailElement.textContent = 'Inicia sesión para ver tu perfil.';
            if (userPicElement) userPicElement.src = 'http://googleusercontent.com/file_content/2'; // Imagen por defecto de no logeado
            return;
        }

        const userId = user.id; // Este es el ID que conecta el usuario de Auth con tu tabla 'users'

        // 2. Obtener los datos del perfil desde tu tabla 'users'
        const { data: profileData, error: profileError } = await supabase
            .from('users') // <-- Consulta tu tabla 'users'
            .select('nom_user, mail') // <-- Pide el nombre de usuario y el correo
            .eq('id_user', userId) // <-- Busca por el ID del usuario autenticado
            .single(); // <-- Espera un único resultado

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: No se encontraron filas
            throw profileError;
        }

        if (profileData) {
            // Si se encuentra el perfil en la tabla 'users', usa esos datos
            if (userNameElement) {
                userNameElement.innerHTML = `${profileData.nom_user} <i class="fas fa-check-circle verified-icon"></i>`;
            }
            if (userMailElement) {
                userMailElement.textContent = profileData.mail;
            }
            // Usa la avatar_url del objeto de autenticación si está disponible
            if (userPicElement) {
                userPicElement.src = user.user_metadata.avatar_url || 'http://googleusercontent.com/file_content/2';
            }
            console.log('profile-script.js: Perfil de usuario cargado desde la tabla "users":', profileData);
        } else {
            // Si no se encontró un perfil en la tabla 'users' (ej. usuario nuevo que no se ha registrado en tu tabla 'users')
            // Entonces, se muestra el nombre o correo del objeto de autenticación como fallback
            console.warn(`profile-script.js: No se encontró un perfil en la tabla 'users' para el ID: ${userId}. Usando datos de autenticación.`);
            if (userNameElement) {
                // Usar full_name de user_metadata si existe, sino el email
                userNameElement.innerHTML = `${user.user_metadata.full_name || user.email} <i class="fas fa-exclamation-triangle"></i>`;
            }
            if (userMailElement) {
                userMailElement.textContent = user.email;
            }
            if (userPicElement) {
                userPicElement.src = user.user_metadata.avatar_url || 'http://googleusercontent.com/file_content/2';
            }
        }
    } catch (error) {
        console.error('profile-script.js: Error al cargar el perfil de usuario:', error.message);
        if (userNameElement) userNameElement.innerHTML = `Error <i class="fas fa-times-circle"></i>`;
        if (userMailElement) userMailElement.textContent = 'Error de carga';
        if (userPicElement) userPicElement.src = 'http://googleusercontent.com/file_content/2'; // Imagen de error
    }
}

// Asegurarse de que el DOM esté completamente cargado antes de intentar manipularlo.
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile(); // Carga el perfil del usuario

    // --- Lógica de navegación ---
    const navLinks = document.querySelectorAll('.navigation a');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            // event.preventDefault(); // Descomenta si los enlaces no deben llevar a otra página
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            console.log(`Navegando a: ${link.textContent.trim()}`);
        });
    });

    // --- Lógica del botón "Volver" ---
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault(); // Evita que el enlace haga una navegación normal
            window.history.back(); // Usa la API de historial del navegador para volver a la página anterior
            console.log('Volviendo a la página anterior...');
        });
    }
});