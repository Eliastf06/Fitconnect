// Importa createClient directamente desde el CDN como un módulo
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Tus credenciales de Supabase
const SUPABASE_URL = 'https://auozbjnxzvttkarghgxc.supabase.co'; // Tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b3piam54enZ0dGthcmdoZ3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDE0MTAsImV4cCI6MjA2NzA3NzQxMH0.nDsQhmF_kwRSUO168CDmdica6OoMN3XMSzXucyr0yDg'; // Tu Anon Key

// Inicializa el cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TODO EL CÓDIGO RESTANTE DEBE IR DENTRO DE ESTE BLOQUE DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

    // Referencias a los elementos del DOM
    const registerForm = document.getElementById('registerForm');
    const appMessageElement = document.getElementById('app-message');

    // Inputs del formulario
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Función para mostrar mensajes al usuario
    function showMessage(message, type = 'success') {
        appMessageElement.textContent = message;
        appMessageElement.style.color = type === 'success' ? 'green' : 'red';
        appMessageElement.style.display = 'block';
        setTimeout(() => {
            appMessageElement.style.display = 'none';
        }, 5000);
    }

    // MANEJO DEL REGISTRO DE USUARIOS con Supabase
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (password !== confirmPassword) {
            showMessage('Las contraseñas no coinciden.', 'error');
            return;
        }
        if (!username || !email || !password) {
            showMessage('Por favor, completa todos los campos.', 'error');
            return;
        }

        showMessage('Registrando usuario...', 'black'); // Mensaje de carga

        try {
            // Paso 1: Registrar el usuario con Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    // Puedes guardar el nombre de usuario en los metadatos del usuario de Supabase Auth
                    data: {
                        username: username
                    }
                }
            });

            if (error) {
                console.error('Error al registrar en Supabase Auth:', error);
                showMessage(`Error al registrar: ${error.message}`, 'error');
                return;
            }

            // Si el registro de Auth fue exitoso:
            if (data.user) {
                // Paso 2: Opcional - Insertar datos adicionales en tu tabla 'users'
                // La contraseña NO se guarda aquí, ya que Supabase Auth la maneja.
                // Es crucial que tu id_user en la tabla 'users' pueda aceptar el ID del usuario de Supabase Auth.
                // Te recomiendo que en tu tabla 'users' el id_user sea PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
                const { error: insertError } = await supabase
                    .from('users') // Tu tabla personalizada
                    .insert([
                        {
                            id_user: data.user.id, // Usa el ID generado por Supabase Auth
                            nom_user: username,
                            mail: email
                            // No insertes 'password' aquí, Supabase Auth la gestiona
                        }
                    ]);

                if (insertError) {
                    console.error('Error al insertar datos en tu tabla "users":', insertError.message);
                    // Puedes decidir qué hacer aquí: si fallar el registro completo o solo alertar
                    showMessage(`Registro exitoso, pero hubo un error al guardar tu nombre de usuario. Error: ${insertError.message}`, 'error');
                } else {
                    showMessage(`¡Registro exitoso! Por favor, revisa tu email (${email}) para confirmar tu cuenta.`, 'success');
                    console.log('Usuario registrado y datos de perfil guardados:', data.user);
                    // Opcional: limpiar formulario y redirigir
                    registerForm.reset();
                    setTimeout(() => {
                        window.location.href = 'signin.html'; // Redirigir a la página de inicio de sesión
                    }, 7000);
                }
            } else {
                // Esto ocurre si la confirmación de email está activa y el usuario se registra pero necesita confirmar
                showMessage('Registro completado, pero se requiere verificación por email. Revisa tu bandeja de entrada o spam.', 'success');
                registerForm.reset();
                setTimeout(() => {
                    window.location.href = 'signin.html';
                }, 7000);
            }

        } catch (err) {
            console.error('Error inesperado al registrar:', err);
            showMessage('Ocurrió un error inesperado durante el registro.', 'error');
        }
    });

    // Opcional: Puedes añadir aquí la lógica para comprobar si un usuario ya está autenticado
    // similar a como lo tienes en tu ejemplo 'scrip-log.js' si regis.html también se usa para eso.
    // Pero si regis.html es solo para registro, esto no sería estrictamente necesario.
});