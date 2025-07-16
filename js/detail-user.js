// js/detail-user.js

// Importa la instancia de supabase desde profile-script.js
import { supabase } from './profile-script.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script de detalles de usuario cargado y listo.');

    // --- Referencias a los elementos interactivos del DOM ---
    const bestPrSquatInput = document.getElementById('bestPrSquatInput');
    const bestPrSquatAcceptButton = document.querySelector('[data-field="best_pr_squat"]');

    const currentWeightInput = document.getElementById('currentWeightInput');
    const currentWeightAcceptButton = document.querySelector('[data-field="current_weight"]');
    const desiredWeightValue = document.getElementById('desiredWeightValue');

    const darkModeToggle = document.getElementById('darkModeToggle');

    // Referencias para Racha
    const userStreakElement = document.getElementById('userStreak');
    const streakFlameIcon = document.getElementById('streakFlame');
    const streakButton = document.getElementById('streakButton');

    // Referencias para Objetivo Semanal
    const weeklyGoalCompletedElement = document.getElementById('weeklyGoalCompleted');
    const weeklyGoalTotalElement = document.getElementById('weeklyGoalTotal');
    const addCompletedSessionButton = document.getElementById('addCompletedSession');
    const resetWeeklyGoalButton = document.getElementById('resetWeeklyGoal');

    // --- Nuevas Referencias para la Foto de Perfil ---
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePicDisplay = document.getElementById('profilePicDisplay');
    const uploadStatus = document.getElementById('uploadStatus'); // Para mostrar mensajes de carga

    let currentUserId = null; // Para almacenar el ID del usuario logeado

    // --- Funciones de utilidad para fechas ---
    function getTodayDateString() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar a inicio del día
        return today.toISOString().split('T')[0];
    }

    function isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    function isYesterday(dateString) {
        if (!dateString) return false;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const checkDate = new Date(dateString);
        checkDate.setHours(0, 0, 0, 0);

        return isSameDay(checkDate, yesterday);
    }

    // Función para actualizar el UI de la racha
    function updateStreakUI(streakValue) {
        if (userStreakElement) {
            userStreakElement.textContent = streakValue + ' ';
        }
        if (streakFlameIcon) {
            if (streakValue > 3) {
                streakFlameIcon.classList.remove('hidden');
            } else {
                streakFlameIcon.classList.add('hidden');
            }
        }
    }

    // Función para cargar los datos del perfil extendido
    async function loadUserSettings() {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) {
                console.warn('detail-user.js: No hay usuario autenticado para cargar configuraciones.');
                disableControls();
                return;
            }

            currentUserId = user.id;

            const { data, error } = await supabase
                .from('user_profiles_data')
                .select('*')
                .eq('user_id', currentUserId)
                .single();

            if (error && error.code === 'PGRST116') { // PGRST116: No rows found
                console.log('detail-user.js: No se encontraron configuraciones para este usuario. Creando una nueva entrada.');
                const created = await createDefaultUserSettings(currentUserId);
                if (created) {
                    console.log('detail-user.js: Configuración por defecto creada exitosamente, recargando datos.');
                    await loadUserSettings();
                } else {
                    console.error('detail-user.js: Fallo al crear la configuración por defecto. Los datos no se mostrarán.');
                    alert('No se pudo crear tu perfil de configuración. Revisa tus permisos o contacta al administrador.');
                    disableControls();
                }
                return;
            } else if (error) {
                throw error;
            }

            // Si hay datos, actualiza la UI
            if (data) {
                if (bestPrSquatInput) bestPrSquatInput.value = data.best_pr_squat !== null ? data.best_pr_squat : 110.00;
                if (currentWeightInput) currentWeightInput.value = data.current_weight !== null ? data.current_weight : 70.00;
                if (desiredWeightValue) desiredWeightValue.textContent = `${data.desired_weight !== null ? data.desired_weight : 80.00}kg`;

                if (darkModeToggle) {
                    darkModeToggle.checked = data.dark_mode_active !== null ? data.dark_mode_active : false;
                    document.body.classList.toggle('dark-mode', darkModeToggle.checked);
                }

                if (weeklyGoalCompletedElement) weeklyGoalCompletedElement.textContent = data.weekly_goal_completed !== null ? data.weekly_goal_completed : 0;
                if (weeklyGoalTotalElement) weeklyGoalTotalElement.textContent = data.weekly_goal_total !== null ? data.weekly_goal_total : 5;

                // --- Cargar foto de perfil ---
                if (profilePicDisplay) {
                    // Si profile_pic_url existe y no es null, úsala. Si no, usa la URL por defecto.
                    profilePicDisplay.src = data.profile_pic_url || 'http://googleusercontent.com/file_content/2';
                }

                // --- Lógica de la racha ---
                let currentStreak = data.user_streak !== null ? data.user_streak : 0;
                const lastUpdateDate = data.last_streak_update_date; // Esto será un string 'YYYY-MM-DD'

                const todayString = getTodayDateString();

                if (lastUpdateDate) {
                    if (isSameDay(lastUpdateDate, todayString)) {
                        // Ya se actualizó hoy
                        if (streakButton) streakButton.disabled = true;
                        console.log('detail-user.js: Racha ya actualizada hoy.');
                    } else if (isYesterday(lastUpdateDate)) {
                        // Se actualizó ayer, puede continuar hoy
                        if (streakButton) streakButton.disabled = false;
                        console.log('detail-user.js: Racha lista para continuar hoy.');
                    } else {
                        // Se rompió la racha (no se actualizó ayer ni hoy)
                        if (currentStreak > 0) { // Solo reinicia si ya tenía una racha
                            currentStreak = 0;
                            await updateUserSettings('user_streak', currentStreak, false); // Actualizar DB sin alert
                            console.log('detail-user.js: Racha reiniciada a 0 por inactividad.');
                        }
                        if (streakButton) streakButton.disabled = false; // Habilitar para empezar una nueva
                    }
                } else {
                    // Nunca se ha actualizado la racha
                    currentStreak = 0; // Asegurarse de que sea 0
                    if (streakButton) streakButton.disabled = false;
                    console.log('detail-user.js: Racha inicializada.');
                }
                updateStreakUI(currentStreak);
                // --- Fin de la lógica de la racha ---
            }

        } catch (error) {
            console.error('detail-user.js: Error al cargar la configuración del usuario:', error.message);
            alert('Error al cargar la configuración. Revisa la consola para más detalles.');
            disableControls();
        }
    }

    // Función para crear una entrada de configuración por defecto si no existe
    async function createDefaultUserSettings(userId) {
        const { data, error } = await supabase
            .from('user_profiles_data')
            .insert([
                {
                    user_id: userId,
                    current_weight: 70.00,
                    desired_weight: 80.00,
                    best_pr_squat: 110.00,
                    dark_mode_active: false,
                    weekly_goal_completed: 0,
                    weekly_goal_total: 5,
                    user_streak: 0,
                    last_streak_update_date: null,
                    profile_pic_url: null // <-- Nuevo campo por defecto
                }
            ]);

        if (error) {
            console.error('detail-user.js: Error al crear configuración por defecto:', error.message);
            alert('No se pudo crear la configuración por defecto para el usuario.');
            return false;
        }
        console.log('detail-user.js: Configuración por defecto creada:', data);
        return true;
    }

    // Función para actualizar datos en la base de datos
    async function updateUserSettings(key, value, showAlert = true) {
        if (!currentUserId) {
            console.error('detail-user.js: No hay usuario autenticado para actualizar la configuración.');
            if (showAlert) alert('Debes iniciar sesión para guardar los cambios.');
            return;
        }
        try {
            const { data, error } = await supabase
                .from('user_profiles_data')
                .update({ [key]: value })
                .eq('user_id', currentUserId);

            if (error) throw error;
            console.log(`detail-user.js: Campo ${key} actualizado a ${value}:`, data);
        } catch (error) {
            console.error(`detail-user.js: Error al actualizar ${key}:`, error.message);
            if (showAlert) alert(`Error al guardar el cambio para ${key}.`);
        }
    }

    // --- Función para subir la foto de perfil a Supabase Storage ---
    async function uploadProfilePicture(file) {
        if (!currentUserId) {
            if (uploadStatus) {
                uploadStatus.textContent = 'Debes iniciar sesión para subir una foto.';
                uploadStatus.style.color = 'red';
            }
            return null;
        }

        if (uploadStatus) {
            uploadStatus.textContent = 'Subiendo foto...';
            uploadStatus.style.color = 'orange';
        }

        const fileExtension = file.name.split('.').pop();
        // Usamos el ID del usuario para el nombre de la imagen para asegurar que sea única por usuario
        // y para sobrescribir la imagen antigua si ya existe.
        const fileName = `${currentUserId}/profile_pic.${fileExtension}`; 
        const bucketName = 'profile-pictures'; // Nombre del bucket que creaste en Supabase Storage

        try {
            // Sube el archivo al bucket
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file, {
                    upsert: true // Si el archivo ya existe con ese nombre, lo sobrescribe
                });

            if (error) {
                throw error;
            }

            // Obtiene la URL pública del archivo subido
            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            if (publicUrlData && publicUrlData.publicUrl) {
                if (uploadStatus) {
                    uploadStatus.textContent = 'Foto subida con éxito.';
                    uploadStatus.style.color = 'green';
                }
                return publicUrlData.publicUrl;
            } else {
                throw new Error('No se pudo obtener la URL pública de la imagen.');
            }
        } catch (error) {
            console.error('Error al subir la foto de perfil:', error.message);
            if (uploadStatus) {
                uploadStatus.textContent = `Error al subir: ${error.message}`;
                uploadStatus.style.color = 'red';
            }
            return null;
        }
    }

    // Función para deshabilitar controles si no hay usuario logeado
    function disableControls() {
        if (bestPrSquatInput) bestPrSquatInput.disabled = true;
        if (bestPrSquatAcceptButton) bestPrSquatAcceptButton.disabled = true;

        if (currentWeightInput) currentWeightInput.disabled = true;
        if (currentWeightAcceptButton) currentWeightAcceptButton.disabled = true;

        if (darkModeToggle) darkModeToggle.disabled = true;
        if (addCompletedSessionButton) addCompletedSessionButton.disabled = true;
        if (resetWeeklyGoalButton) resetWeeklyGoalButton.disabled = true;
        if (streakButton) streakButton.disabled = true;

        // Deshabilitar input de foto de perfil
        if (profilePicInput) profilePicInput.disabled = true;
        if (uploadStatus) uploadStatus.textContent = ''; // Limpiar mensaje de estado

        if (bestPrSquatInput) {
            bestPrSquatInput.value = '';
            bestPrSquatInput.placeholder = '--';
        }
        if (currentWeightInput) {
            currentWeightInput.value = '';
            currentWeightInput.placeholder = '--';
        }
        if (desiredWeightValue) desiredWeightValue.textContent = '--kg';
        if (weeklyGoalCompletedElement) weeklyGoalCompletedElement.textContent = '--';
        if (weeklyGoalTotalElement) weeklyGoalTotalElement.textContent = '--';
        if (userStreakElement) userStreakElement.textContent = '-- ';
        if (streakFlameIcon) streakFlameIcon.classList.add('hidden');
        if (profilePicDisplay) profilePicDisplay.src = 'http://googleusercontent.com/file_content/2'; // Restablecer a imagen por defecto
    }


    // --- Event Listeners para los botones de Aceptar ---
    if (bestPrSquatAcceptButton) {
        bestPrSquatAcceptButton.addEventListener('click', () => {
            const value = parseFloat(bestPrSquatInput.value);
            if (!isNaN(value)) {
                updateUserSettings('best_pr_squat', value);
            } else {
                alert('Por favor, ingresa un número válido para el Mejor PR.');
            }
        });
    }

    if (currentWeightAcceptButton) {
        currentWeightAcceptButton.addEventListener('click', () => {
            const value = parseFloat(currentWeightInput.value);
            if (!isNaN(value)) {
                updateUserSettings('current_weight', value);
            } else {
                alert('Por favor, ingresa un número válido para el Peso actual.');
            }
        });
    }

    // --- Event Listener para el toggle de Dark Mode ---
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (event) => {
            updateUserSettings('dark_mode_active', event.target.checked);
            document.body.classList.toggle('dark-mode', event.target.checked);
        });
    }

    // --- Lógica del botón de Racha ---
    if (streakButton) {
        streakButton.addEventListener('click', async () => {
            if (!currentUserId) {
                alert('Debes iniciar sesión para actualizar tu racha.');
                return;
            }

            const todayString = getTodayDateString();

            const { data: currentStreakData, error: fetchError } = await supabase
                .from('user_profiles_data')
                .select('user_streak, last_streak_update_date')
                .eq('user_id', currentUserId)
                .single();

            if (fetchError) {
                console.error('detail-user.js: Error al obtener datos de racha para actualización:', fetchError.message);
                alert('Error al actualizar la racha. Intenta de nuevo.');
                return;
            }

            let currentStreak = currentStreakData.user_streak || 0;
            const lastUpdateDate = currentStreakData.last_streak_update_date;

            if (isSameDay(lastUpdateDate, todayString)) {
                alert('Ya has añadido un día a tu racha hoy.');
                if (streakButton) streakButton.disabled = true;
                return;
            }

            let newStreak = currentStreak + 1;
            
            if (lastUpdateDate && !isYesterday(lastUpdateDate)) {
                 newStreak = 1; 
                 alert('Tu racha se ha roto. ¡Empecemos una nueva!');
            } else if (!lastUpdateDate) {
                 newStreak = 1;
            }
            
            await updateUserSettings('user_streak', newStreak, false);
            await updateUserSettings('last_streak_update_date', todayString, false);

            updateStreakUI(newStreak);
            if (streakButton) streakButton.disabled = true;
            alert(`¡Racha actualizada a ${newStreak} días!`);
        });
    }

    // --- Lógica para el card de Objetivo Semanal ---
    if (addCompletedSessionButton) {
        addCompletedSessionButton.addEventListener('click', async () => {
            if (!currentUserId) {
                alert('Debes iniciar sesión para registrar sesiones.');
                return;
            }
            let currentCompleted = parseInt(weeklyGoalCompletedElement.textContent);
            let totalGoal = parseInt(weeklyGoalTotalElement.textContent);

            if (currentCompleted < totalGoal) {
                currentCompleted++;
                weeklyGoalCompletedElement.textContent = currentCompleted;
                await updateUserSettings('weekly_goal_completed', currentCompleted);
            } else {
                alert('¡Ya has completado tu objetivo semanal!');
            }
        });
    }

    if (resetWeeklyGoalButton) {
        resetWeeklyGoalButton.addEventListener('click', async () => {
            if (!currentUserId) {
                alert('Debes iniciar sesión para reiniciar el objetivo.');
                return;
            }
            if (confirm('¿Estás seguro de que quieres reiniciar tu objetivo semanal?')) {
                weeklyGoalCompletedElement.textContent = 0;
                await updateUserSettings('weekly_goal_completed', 0);
                alert('Objetivo semanal reiniciado.');
            }
        });
    }

    // --- Event Listener para el input de la foto de perfil ---
    if (profilePicInput) {
        profilePicInput.addEventListener('change', async (event) => {
            const file = event.target.files[0]; // Obtiene el archivo seleccionado
            if (file) {
                const newProfilePicUrl = await uploadProfilePicture(file); // Sube el archivo
                if (newProfilePicUrl) {
                    // Si la subida fue exitosa, actualiza la URL en la base de datos
                    await updateUserSettings('profile_pic_url', newProfilePicUrl, false); // No mostrar alert
                    // Y actualiza la imagen mostrada en la página
                    if (profilePicDisplay) {
                        profilePicDisplay.src = newProfilePicUrl;
                    }
                }
            }
        });
    }

    // Cargar los settings al inicio
    await loadUserSettings();
});