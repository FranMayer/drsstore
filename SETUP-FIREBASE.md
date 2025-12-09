# 🔥 Configuración de Firebase para DRS Store

## Paso 1: Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en **"Agregar proyecto"**
3. Nombre del proyecto: `drs-store` (o el que prefieras)
4. Desactiva Google Analytics (opcional para este proyecto)
5. Click en **"Crear proyecto"**

## Paso 2: Agregar app web

1. En la página principal del proyecto, click en el ícono **Web** (`</>`)
2. Nombre de la app: `DRS Store Web`
3. **NO** marques "Firebase Hosting" (no lo necesitamos por ahora)
4. Click en **"Registrar app"**
5. **Copia los valores de configuración** que aparecen

## Paso 3: Crear base de datos Firestore

1. En el menú lateral, ve a **"Firestore Database"**
2. Click en **"Crear base de datos"**
3. Selecciona **"Comenzar en modo de prueba"**
   - ⚠️ Esto permite lectura/escritura sin autenticación por 30 días
   - Ideal para desarrollo
4. Selecciona la ubicación: **`southamerica-east1`** (São Paulo - más cercano a Argentina)
5. Click en **"Habilitar"**

## Paso 4: Configurar el proyecto

Abre el archivo `/js/firebase-config.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",              // Tu API Key
    authDomain: "drs-store.firebaseapp.com",
    projectId: "drs-store",
    storageBucket: "drs-store.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

## Paso 5: Importar productos

1. Abre el panel de administración: `/admin/index.html`
2. Verifica que diga **"✅ Conectado"** arriba a la derecha
3. Click en **"📥 Importar datos de ejemplo"**
4. ¡Listo! Los productos ahora están en Firebase

---

## 📊 Estructura de la Base de Datos

### Colección: `products`

Cada documento tiene estos campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | string | Nombre del producto |
| `description` | string | Descripción corta |
| `price` | number | Precio en pesos (ej: 15200) |
| `stock` | number | Cantidad disponible |
| `category` | string | Categoría (Remeras, Buzos, etc.) |
| `image` | string | Ruta de la imagen (ej: /multi/imagen.jpg) |
| `active` | boolean | Si está visible en el catálogo |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última actualización |

---

## 🔐 Reglas de Seguridad (Producción)

Cuando vayas a producción, actualiza las reglas en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Productos: lectura pública, escritura solo admin
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

---

## 💰 Costos de Firebase

Firebase tiene un **plan gratuito generoso**:

- ✅ 50,000 lecturas/día
- ✅ 20,000 escrituras/día  
- ✅ 1 GB de almacenamiento

Para una tienda pequeña/mediana, **es más que suficiente y gratuito**.

---

## 🚀 Migración futura

Cuando el proyecto crezca, podés migrar a:

1. **Tu propio servidor PHP + MySQL**
   - Solo tenés que modificar `/js/products-service.js`
   - El resto de la app sigue igual

2. **Supabase** (PostgreSQL)
   - Similar a Firebase pero con SQL
   - Gratis hasta 500MB

3. **Backend propio con API REST**
   - Node.js, Python, PHP, etc.

La capa de abstracción `ProductsService` hace que la migración sea simple.

---

## ❓ Problemas comunes

### "Firebase no está configurado"
- Verificá que copiaste bien los valores en `firebase-config.js`
- La `apiKey` debe empezar con `AIza...`

### "Permission denied"
- Las reglas de Firestore están en modo producción
- Ve a Firestore > Reglas y ponelas en modo prueba

### Los productos no cargan
- Abrí la consola del navegador (F12) y revisá errores
- Verificá que Firebase esté conectado (panel admin)

---

¿Dudas? Contactame en [contacto@drsstore.com](mailto:contacto@drsstore.com)

