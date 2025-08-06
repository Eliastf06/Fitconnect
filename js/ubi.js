let map; // Variable global para el objeto del mapa
let userMarker; // Variable global para el marcador del usuario

// Función de inicialización del mapa (llamada por la API de Google Maps)
function initMap() {
    // Coordenadas predeterminadas (ej. centro de Argentina)
    const defaultLocation = { lat: -34.6037, lng: -58.3816 };

    // Opciones del mapa
    const mapOptions = {
        zoom: 12,
        center: defaultLocation,
        mapTypeId: 'roadmap', // 'roadmap', 'satellite', 'hybrid', 'terrain'
        // Estilo oscuro para el mapa
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }],
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
            },
        ],
    };

    // Crear el mapa
    map = new google.maps.Map(document.getElementById("map"), mapOptions);

    // Intentar obtener la ubicación automáticamente al cargar
    getLocation();
}

// Función para obtener la ubicación del usuario
function getLocation() {
    const locationErrorElement = document.getElementById("locationError");
    locationErrorElement.textContent = ""; // Limpiar mensajes de error previos

    if (navigator.geolocation) {
        // Opciones para la geolocalización
        const geoOptions = {
            enableHighAccuracy: true, // Solicitar alta precisión
            timeout: 5000, // Tiempo máximo para obtener la ubicación (5 segundos)
            maximumAge: 0 // No usar una posición en caché
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                updateMap(userLatLng);
            },
            (error) => {
                handleLocationError(error);
            },
            geoOptions
        );
    } else {
        locationErrorElement.textContent = "Tu navegador no soporta la geolocalización.";
    }
}

// Función para actualizar el mapa con la nueva ubicación
function updateMap(latLng) {
    if (!map) {
        console.error("El mapa no está inicializado.");
        return;
    }

    map.setCenter(latLng);
    map.setZoom(15); // Aumentar el zoom para ver la ubicación más de cerca

    // Si ya existe un marcador, lo eliminamos
    if (userMarker) {
        userMarker.setMap(null);
    }

    // Crea un ícono personalizado con un color neón
    const neonMarkerIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#39ff14', // Verde neón
        fillOpacity: 1,
        strokeColor: '#ff3366', // Rojo neón para el borde
        strokeWeight: 2,
        scale: 8,
    };

    // Crea un nuevo marcador para la ubicación del usuario
    userMarker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: "Tu Ubicación Actual",
        icon: neonMarkerIcon,
        animation: google.maps.Animation.DROP, // Animación al aparecer
    });

    // Añadir un InfoWindow para mostrar las coordenadas
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="font-family: 'Montserrat', sans-serif; color: #333;">
                <h3>Tu Ubicación</h3>
                <p>Latitud: ${latLng.lat.toFixed(6)}</p>
                <p>Longitud: ${latLng.lng.toFixed(6)}</p>
            </div>
        `,
    });

    userMarker.addListener("click", () => {
        infoWindow.open(map, userMarker);
    });
}

// Manejador de errores de geolocalización
function handleLocationError(error) {
    const locationErrorElement = document.getElementById("locationError");
    switch (error.code) {
        case error.PERMISSION_DENIED:
            locationErrorElement.textContent = "Permiso denegado: Por favor, habilita la geolocalización para ver tu ubicación.";
            break;
        case error.POSITION_UNAVAILABLE:
            locationErrorElement.textContent = "Información de ubicación no disponible. Inténtalo de nuevo más tarde.";
            break;
        case error.TIMEOUT:
            locationErrorElement.textContent = "La solicitud para obtener la ubicación ha caducado. Inténtalo de nuevo.";
            break;
        case error.UNKNOWN_ERROR:
            locationErrorElement.textContent = "Ha ocurrido un error desconocido al obtener tu ubicación.";
            break;
    }
}

// Asignar el evento click al botón
document.addEventListener("DOMContentLoaded", () => {
    const getLocationBtn = document.getElementById("getLocationBtn");
    if (getLocationBtn) {
        getLocationBtn.addEventListener("click", getLocation);
    }
});
