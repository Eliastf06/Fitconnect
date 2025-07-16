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
    const desiredWeightInput = document.getElementById('desiredWeightInput');
    const desiredWeightAcceptButton = document.querySelector('[data-field="desired_weight"]');

    // Referencias para Racha
    const userStreakElement = document.getElementById('userStreak');
    const streakFlameIcon = document.getElementById('streakFlame');
    const streakButton = document.getElementById('streakButton');

    // Referencias para Objetivo Semanal
    const weeklyGoalCompletedElement = document.getElementById('weeklyGoalCompleted');
    const weeklyGoalTotalElement = document.getElementById('weeklyGoalTotal');
    const addCompletedSessionButton = document.getElementById('addCompletedSession');
    const resetWeeklyGoalButton = document.getElementById('resetWeeklyGoal');

    // Referencias para la Foto de Perfil
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePicDisplay = document.getElementById('profilePicDisplay');
    const uploadStatus = document.getElementById('uploadStatus'); // Para mostrar mensajes de carga

    // --- NUEVAS REFERENCIAS DE DOM PARA LAS NUEVAS FUNCIONES ---
    const heightCmInput = document.getElementById('heightCmInput');
    const bmiValueElement = document.getElementById('bmiValue');
    
    const waterIntakeMlElement = document.getElementById('waterIntakeMl');
    const addWaterButton = document.getElementById('addWaterButton');
    const resetWaterButton = document.getElementById('resetWaterButton');

    const dailyStepGoalInput = document.getElementById('dailyStepGoalInput');

    const lastTrainingDateInput = document.getElementById('lastTrainingDateInput');
    const lastTrainingDateDisplay = document.getElementById('lastTrainingDateDisplay');

    const waistCmInput = document.getElementById('waistCmInput');

    const dailyNotesInput = document.getElementById('dailyNotesInput');
    const saveNotesButton = document.getElementById('saveNotesButton');
    const clearNotesButton = document.getElementById('clearNotesButton');
    const notesStatus = document.getElementById('notesStatus');

    const dailyCalorieGoalInput = document.getElementById('dailyCalorieGoalInput');

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

    // Función para calcular y mostrar el IMC
    function calculateAndDisplayBMI() {
        const currentWeight = parseFloat(currentWeightInput.value);
        const heightCm = parseFloat(heightCmInput.value);

        if (!isNaN(currentWeight) && !isNaN(heightCm) && heightCm > 0) {
            const heightM = heightCm / 100; // Convertir cm a metros
            const bmi = currentWeight / (heightM * heightM);
            if (bmiValueElement) {
                bmiValueElement.textContent = bmi.toFixed(2);
            }
        } else {
            if (bmiValueElement) {
                bmiValueElement.textContent = '--';
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
                if (desiredWeightInput) desiredWeightInput.value = data.desired_weight !== null ? data.desired_weight : 80.00;

                // --- Carga de nuevas funciones ---
                if (heightCmInput) heightCmInput.value = data.height_cm !== null ? data.height_cm : 170.00;
                calculateAndDisplayBMI(); // Calcula y muestra el IMC al cargar

                if (waterIntakeMlElement) waterIntakeMlElement.textContent = data.water_intake_ml !== null ? data.water_intake_ml : 0;
                // Lógica de reseteo de agua diaria
                const lastWaterReset = data.last_water_reset_date;
                if (!lastWaterReset || !isSameDay(lastWaterReset, getTodayDateString())) {
                    if (data.water_intake_ml > 0) { // Si hay agua del día anterior, resetear
                        await updateUserSettings('water_intake_ml', 0, false);
                        await updateUserSettings('last_water_reset_date', getTodayDateString(), false);
                        waterIntakeMlElement.textContent = 0;
                    }
                }
                
                if (dailyStepGoalInput) dailyStepGoalInput.value = data.daily_step_goal !== null ? data.daily_step_goal : 10000;
                
                if (lastTrainingDateInput) {
                    // Formato para input type="date" (YYYY-MM-DD)
                    lastTrainingDateInput.value = data.last_training_date || ''; 
                }
                if (lastTrainingDateDisplay) {
                    // Formato para mostrar en texto
                    lastTrainingDateDisplay.textContent = data.last_training_date ? new Date(data.last_training_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
                }

                if (waistCmInput) waistCmInput.value = data.waist_cm !== null ? data.waist_cm : 80.00;
                
                if (dailyNotesInput) dailyNotesInput.value = data.daily_notes !== null ? data.daily_notes : '';
                // Lógica de reseteo de notas diarias
                const lastNotesReset = data.last_notes_date;
                if (!lastNotesReset || !isSameDay(lastNotesReset, getTodayDateString())) {
                    if (data.daily_notes !== '') { // Si hay notas del día anterior, resetear
                        await updateUserSettings('daily_notes', '', false);
                        await updateUserSettings('last_notes_date', getTodayDateString(), false);
                        dailyNotesInput.value = '';
                        if (notesStatus) notesStatus.textContent = '';
                    }
                }

                if (dailyCalorieGoalInput) dailyCalorieGoalInput.value = data.daily_calorie_goal !== null ? data.daily_calorie_goal : 2000;

                // --- Fin de carga de nuevas funciones ---

                if (weeklyGoalCompletedElement) weeklyGoalCompletedElement.textContent = data.weekly_goal_completed !== null ? data.weekly_goal_completed : 0;
                if (weeklyGoalTotalElement) weeklyGoalTotalElement.textContent = data.weekly_goal_total !== null ? data.weekly_goal_total : 5;

                // --- Cargar foto de perfil ---
                if (profilePicDisplay) {
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
                    weekly_goal_completed: 0,
                    weekly_goal_total: 5,
                    user_streak: 0,
                    last_streak_update_date: null,
                    profile_pic_url: null,
                    // --- NUEVOS VALORES POR DEFECTO PARA LAS NUEVAS FUNCIONES ---
                    height_cm: 170.0,
                    water_intake_ml: 0,
                    last_water_reset_date: null,
                    daily_step_goal: 10000,
                    last_training_date: null,
                    waist_cm: 80.0,
                    daily_notes: '',
                    last_notes_date: null,
                    daily_calorie_goal: 2000
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
            if (showAlert) {
                // Pequeño feedback visual
                const button = document.querySelector(`[data-field="${key}"]`);
                if (button) {
                    button.textContent = 'Guardado!';
                    setTimeout(() => {
                        button.textContent = 'Aceptar'; // O el texto original si no es 'Aceptar'
                        // Restaurar iconos si aplica
                        if (key === 'daily_notes') {
                             button.innerHTML = '<i class="fas fa-save"></i> Guardar Notas';
                        }
                        if (key === 'daily_step_goal' || key === 'waist_cm' || key === 'height_cm' || key === 'daily_calorie_goal' || key === 'best_pr_squat' || key === 'current_weight' || key === 'desired_weight') {
                            // No hay iconos en estos botones, solo restaurar texto
                        } else if (key === 'last_training_date') {
                             button.innerHTML = 'Guardar';
                        }
                    }, 1500);
                }
            }
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
        const fileName = `${currentUserId}/profile_pic.${fileExtension}`; 
        const bucketName = 'profile-pictures';

        try {
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file, {
                    upsert: true
                });

            if (error) {
                throw error;
            }

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
        if (desiredWeightInput) desiredWeightInput.disabled = true;
        if (desiredWeightAcceptButton) desiredWeightAcceptButton.disabled = true;

        if (addCompletedSessionButton) addCompletedSessionButton.disabled = true;
        if (resetWeeklyGoalButton) resetWeeklyGoalButton.disabled = true;
        if (streakButton) streakButton.disabled = true;

        if (profilePicInput) profilePicInput.disabled = true;
        if (uploadStatus) uploadStatus.textContent = '';

        // --- Deshabilita NUEVAS FUNCIONES ---
        if (heightCmInput) heightCmInput.disabled = true;
        if (addWaterButton) addWaterButton.disabled = true;
        if (resetWaterButton) resetWaterButton.disabled = true;
        if (dailyStepGoalInput) dailyStepGoalInput.disabled = true;
        if (lastTrainingDateInput) lastTrainingDateInput.disabled = true;
        if (waistCmInput) waistCmInput.disabled = true;
        if (dailyNotesInput) dailyNotesInput.disabled = true;
        if (saveNotesButton) saveNotesButton.disabled = true;
        if (clearNotesButton) clearNotesButton.disabled = true;
        if (dailyCalorieGoalInput) dailyCalorieGoalInput.disabled = true;

        if (bestPrSquatInput) {
            bestPrSquatInput.value = '';
            bestPrSquatInput.placeholder = '--';
        }
        if (currentWeightInput) {
            currentWeightInput.value = '';
            currentWeightInput.placeholder = '--';
        }
        if (desiredWeightInput) {
            desiredWeightInput.value = '';
            desiredWeightInput.placeholder = '--';
        }
        if (weeklyGoalCompletedElement) weeklyGoalCompletedElement.textContent = '--';
        if (weeklyGoalTotalElement) weeklyGoalTotalElement.textContent = '--';
        if (userStreakElement) userStreakElement.textContent = '-- ';
        if (streakFlameIcon) streakFlameIcon.classList.add('hidden');
        if (profilePicDisplay) profilePicDisplay.src = 'http://googleusercontent.com/file_content/2';

        // --- Limpia y deshabilita NUEVAS FUNCIONES ---
        if (heightCmInput) { heightCmInput.value = ''; heightCmInput.placeholder = '--'; }
        if (bmiValueElement) bmiValueElement.textContent = '--';
        if (waterIntakeMlElement) waterIntakeMlElement.textContent = '--';
        if (dailyStepGoalInput) { dailyStepGoalInput.value = ''; dailyStepGoalInput.placeholder = '--'; }
        if (lastTrainingDateInput) lastTrainingDateInput.value = '';
        if (lastTrainingDateDisplay) lastTrainingDateDisplay.textContent = 'N/A';
        if (waistCmInput) { waistCmInput.value = ''; waistCmInput.placeholder = '--'; }
        if (dailyNotesInput) { dailyNotesInput.value = ''; dailyNotesInput.placeholder = 'Iniciar sesión para añadir notas...'; }
        if (notesStatus) notesStatus.textContent = '';
        if (dailyCalorieGoalInput) { dailyCalorieGoalInput.value = ''; dailyCalorieGoalInput.placeholder = '--'; }

        // Deshabilitar todos los botones de aceptar de forma genérica
        document.querySelectorAll('.control-button.accept-button').forEach(button => {
            button.disabled = true;
        });
    }


    // --- Event Listeners para los botones de Aceptar ---
    // Se mantiene la lógica existente
    document.querySelectorAll('.control-button.accept-button[data-field]').forEach(button => {
        button.addEventListener('click', async () => {
            const field = button.dataset.field;
            const inputId = button.dataset.input;
            const inputElement = document.getElementById(inputId);
            
            if (!inputElement) return;

            let value;
            if (inputElement.type === 'number') {
                value = parseFloat(inputElement.value);
                if (isNaN(value)) {
                    alert('Por favor, ingresa un número válido.');
                    return;
                }
            } else if (inputElement.type === 'date') {
                value = inputElement.value; // Ya viene en formato YYYY-MM-DD
                if (!value) {
                    alert('Por favor, selecciona una fecha válida.');
                    return;
                }
            } else {
                value = inputElement.value;
            }
            
            await updateUserSettings(field, value);

            // Actualizar IMC si se cambia peso o altura
            if (field === 'current_weight' || field === 'height_cm') {
                calculateAndDisplayBMI();
            }
            // Actualizar display de fecha si se cambia
            if (field === 'last_training_date' && lastTrainingDateDisplay && value) {
                lastTrainingDateDisplay.textContent = new Date(value).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            }
        });
    });

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

    // --- NUEVOS EVENT LISTENERS PARA LAS NUEVAS FUNCIONES ---

    // Event Listeners para recalculado de IMC
    if (currentWeightInput) currentWeightInput.addEventListener('input', calculateAndDisplayBMI);
    if (heightCmInput) heightCmInput.addEventListener('input', calculateAndDisplayBMI);

    // Event Listeners para Consumo de Agua
    if (addWaterButton) {
        addWaterButton.addEventListener('click', async () => {
            if (!currentUserId) {
                alert('Debes iniciar sesión para registrar el consumo de agua.');
                return;
            }
            let currentWater = parseInt(waterIntakeMlElement.textContent);
            currentWater += 250; // Añadir 250ml
            waterIntakeMlElement.textContent = currentWater;
            await updateUserSettings('water_intake_ml', currentWater, false);
            await updateUserSettings('last_water_reset_date', getTodayDateString(), false); // Marcar que se actualizó hoy
        });
    }
    if (resetWaterButton) {
        resetWaterButton.addEventListener('click', async () => {
            if (!currentUserId) {
                alert('Debes iniciar sesión para reiniciar el consumo de agua.');
                return;
            }
            if (confirm('¿Reiniciar el consumo de agua del día?')) {
                waterIntakeMlElement.textContent = 0;
                await updateUserSettings('water_intake_ml', 0, false);
                await updateUserSettings('last_water_reset_date', getTodayDateString(), false); // Marcar que se reinició hoy
            }
        });
    }

    // Event Listeners para Notas Rápidas
    if (saveNotesButton) {
        saveNotesButton.addEventListener('click', async () => {
            if (!currentUserId) {
                alert('Debes iniciar sesión para guardar notas.');
                return;
            }
            const notes = dailyNotesInput.value;
            if (notesStatus) {
                notesStatus.textContent = 'Guardando...';
                notesStatus.style.color = 'orange';
            }
            await updateUserSettings('daily_notes', notes, false);
            await updateUserSettings('last_notes_date', getTodayDateString(), false);
            if (notesStatus) {
                notesStatus.textContent = 'Notas guardadas.';
                notesStatus.style.color = 'green';
                setTimeout(() => { notesStatus.textContent = ''; }, 2000);
            }
        });
    }

    if (clearNotesButton) {
        clearNotesButton.addEventListener('click', async () => {
            if (!currentUserId) {
                alert('Debes iniciar sesión para limpiar notas.');
                return;
            }
            if (confirm('¿Borrar las notas de hoy?')) {
                dailyNotesInput.value = '';
                if (notesStatus) {
                    notesStatus.textContent = 'Limpiando...';
                    notesStatus.style.color = 'orange';
                }
                await updateUserSettings('daily_notes', '', false);
                await updateUserSettings('last_notes_date', getTodayDateString(), false); // Se marca para hoy, para que no se recarguen las viejas
                if (notesStatus) {
                    notesStatus.textContent = 'Notas limpiadas.';
                    notesStatus.style.color = 'green';
                    setTimeout(() => { notesStatus.textContent = ''; }, 2000);
                }
            }
        });
    }


    // Cargar los settings al inicio
    await loadUserSettings();
});
