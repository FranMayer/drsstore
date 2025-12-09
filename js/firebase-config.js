/**
 * DRS Store - Firebase Configuration
 * Configuración de Firebase para el catálogo de productos
 */

// =====================================================
// CONFIGURACIÓN DE FIREBASE - TUS CREDENCIALES
// =====================================================
const firebaseConfig = {
    apiKey: "AIzaSyBSLZvcaLW_hFu4MMoYXpI_aOHoXJ0mhTA",
    authDomain: "drsstore-e7a7c.firebaseapp.com",
    projectId: "drsstore-e7a7c",
    storageBucket: "drsstore-e7a7c.firebasestorage.app",
    messagingSenderId: "943658124864",
    appId: "1:943658124864:web:a83d762ed723f0db7681a5",
    measurementId: "G-HGQDR5J1SK"
};

// =====================================================
// INICIALIZACIÓN DE FIREBASE
// =====================================================
let db = null;
let firebaseInitialized = false;

// Verificar si Firebase está configurado
function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "TU_API_KEY";
}

// Inicializar Firebase
function initializeFirebase() {
    if (!isFirebaseConfigured()) {
        console.warn('⚠️ Firebase no está configurado. Usando datos de ejemplo.');
        return false;
    }

    try {
        // Inicializar Firebase (usando la versión compat cargada via CDN)
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        firebaseInitialized = true;
        console.log('✅ Firebase inicializado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        return false;
    }
}

// =====================================================
// EXPORTAR CONFIGURACIÓN
// =====================================================
window.FirebaseConfig = {
    init: initializeFirebase,
    isConfigured: isFirebaseConfigured,
    getDb: () => db,
    isInitialized: () => firebaseInitialized
};
