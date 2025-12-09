/**
 * DRS Store - Products Service
 * Capa de abstracción para manejar productos
 * 
 * Esta capa permite cambiar fácilmente de Firebase a otra base de datos
 * sin modificar el resto del código de la aplicación.
 */

// =====================================================
// DATOS DE EJEMPLO (cuando Firebase no está configurado)
// =====================================================
const SAMPLE_PRODUCTS = [
    {
        id: 'ferrari-001',
        name: 'Remera Ferrari',
        description: '100% Algodón + DTF Premium',
        price: 15200,
        stock: 0,
        category: 'Remeras',
        image: '/multi/Remera FERRARI (Delantera).jpg',
        active: true
    },
    {
        id: 'aston-002',
        name: 'Remera Aston Martin',
        description: '100% Algodón + DTF Premium',
        price: 15200,
        stock: 0,
        category: 'Remeras',
        image: '/multi/Remera ASTON MARTIN (Delantera).png',
        active: true
    },
    {
        id: 'alpine-003',
        name: 'Remera Alpine',
        description: '100% Algodón + DTF Premium',
        price: 15200,
        stock: 0,
        category: 'Remeras',
        image: '/multi/Remera Alpine (Delantera).jpg',
        active: true
    },
    {
        id: 'williams-004',
        name: 'Remera Williams',
        description: '100% Algodón + DTF Premium',
        price: 15200,
        stock: 0,
        category: 'Remeras',
        image: '/multi/Remera WILLIAMS (Delantera).png',
        active: true
    },
    {
        id: 'haas-005',
        name: 'Remera Haas',
        description: '100% Algodón + DTF Premium',
        price: 14900,
        stock: 0,
        category: 'Remeras',
        image: '/multi/Remera HAAS (Delantera).png',
        active: true
    },
    {
        id: 'mclaren-006',
        name: 'Remera McLaren',
        description: '100% Algodón + DTF Premium',
        price: 15000,
        stock: 0,
        category: 'Remeras',
        image: '/multi/Remera MCLAREN (Delantera) (1).png',
        active: true
    },
    {
        id: 'mercedes-007',
        name: 'Remera Mercedes Benz',
        description: '100% Algodón + DTF Premium',
        price: 14300,
        stock: 0,
        category: 'Remeras',
        image: '/multi/Remera MERCEDES (Delantera).png',
        active: true
    },
    {
        id: 'redbull-008',
        name: 'Remera Red Bull',
        description: '100% Algodón + DTF Premium',
        price: 15900,
        stock: 0,
        category: 'Remeras',
        image: '/multi/Remera RED BULL (Delantera).png',
        active: true
    },
    {
        id: 'alfaromeo-009',
        name: 'Remera Alfa Romeo',
        description: '100% Algodón + DTF Premium',
        price: 15200,
        stock: 0,
        category: 'Remeras',
        image: '/multi/Remera Alfa Romeo (Delantera).png',
        active: true
    }
];

// =====================================================
// SERVICIO DE PRODUCTOS
// =====================================================
const ProductsService = {
    
    /**
     * Obtener todos los productos
     * @param {string} category - Filtrar por categoría (opcional)
     * @returns {Promise<Array>} Lista de productos
     */
    async getAll(category = null) {
        // Si Firebase está configurado, usar Firestore
        if (window.FirebaseConfig && window.FirebaseConfig.isInitialized()) {
            return await this._getFromFirestore(category);
        }
        
        // Si no, usar datos de ejemplo
        return this._getFromSample(category);
    },

    /**
     * Obtener un producto por ID
     * @param {string} id - ID del producto
     * @returns {Promise<Object|null>} Producto o null
     */
    async getById(id) {
        if (window.FirebaseConfig && window.FirebaseConfig.isInitialized()) {
            const db = window.FirebaseConfig.getDb();
            const doc = await db.collection('products').doc(id).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        }
        
        return SAMPLE_PRODUCTS.find(p => p.id === id) || null;
    },

    /**
     * Obtener categorías disponibles
     * @returns {Promise<Array>} Lista de categorías
     */
    async getCategories() {
        const products = await this.getAll();
        const categories = [...new Set(products.map(p => p.category))];
        return categories.sort();
    },

    /**
     * Actualizar stock de un producto
     * @param {string} id - ID del producto
     * @param {number} quantity - Cantidad a restar
     */
    async updateStock(id, quantity) {
        if (window.FirebaseConfig && window.FirebaseConfig.isInitialized()) {
            const db = window.FirebaseConfig.getDb();
            const productRef = db.collection('products').doc(id);
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(productRef);
                if (doc.exists) {
                    const newStock = Math.max(0, doc.data().stock - quantity);
                    transaction.update(productRef, { stock: newStock });
                }
            });
        }
    },

    // =====================================================
    // MÉTODOS PRIVADOS
    // =====================================================

    /**
     * Obtener productos desde Firestore
     */
    async _getFromFirestore(category) {
        const db = window.FirebaseConfig.getDb();
        let query = db.collection('products').where('active', '==', true);
        
        if (category && category !== 'all') {
            query = query.where('category', '==', category);
        }
        
        const snapshot = await query.get();
        const products = [];
        
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        return products;
    },

    /**
     * Obtener productos desde datos de ejemplo
     */
    _getFromSample(category) {
        let products = SAMPLE_PRODUCTS.filter(p => p.active);
        
        if (category && category !== 'all') {
            products = products.filter(p => p.category === category);
        }
        
        return Promise.resolve(products);
    },

    // =====================================================
    // MÉTODOS DE ADMINISTRACIÓN (para el panel admin)
    // =====================================================

    /**
     * Crear un nuevo producto
     */
    async create(productData) {
        if (!window.FirebaseConfig || !window.FirebaseConfig.isInitialized()) {
            throw new Error('Firebase no está configurado');
        }

        const db = window.FirebaseConfig.getDb();
        const docRef = await db.collection('products').add({
            ...productData,
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return docRef.id;
    },

    /**
     * Actualizar un producto
     */
    async update(id, productData) {
        if (!window.FirebaseConfig || !window.FirebaseConfig.isInitialized()) {
            throw new Error('Firebase no está configurado');
        }

        const db = window.FirebaseConfig.getDb();
        await db.collection('products').doc(id).update({
            ...productData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    /**
     * Eliminar un producto (soft delete)
     */
    async delete(id) {
        if (!window.FirebaseConfig || !window.FirebaseConfig.isInitialized()) {
            throw new Error('Firebase no está configurado');
        }

        const db = window.FirebaseConfig.getDb();
        await db.collection('products').doc(id).update({
            active: false,
            deletedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    /**
     * Obtener todos los productos (incluyendo inactivos) - Solo admin
     */
    async getAllAdmin() {
        if (!window.FirebaseConfig || !window.FirebaseConfig.isInitialized()) {
            return SAMPLE_PRODUCTS;
        }

        const db = window.FirebaseConfig.getDb();
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
        const products = [];
        
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        return products;
    },

    /**
     * Importar productos de ejemplo a Firestore
     */
    async importSampleProducts() {
        if (!window.FirebaseConfig || !window.FirebaseConfig.isInitialized()) {
            throw new Error('Firebase no está configurado');
        }

        const db = window.FirebaseConfig.getDb();
        const batch = db.batch();

        SAMPLE_PRODUCTS.forEach(product => {
            const docRef = db.collection('products').doc(product.id);
            batch.set(docRef, {
                ...product,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        console.log('✅ Productos de ejemplo importados a Firebase');
    }
};

// Exportar globalmente
window.ProductsService = ProductsService;

