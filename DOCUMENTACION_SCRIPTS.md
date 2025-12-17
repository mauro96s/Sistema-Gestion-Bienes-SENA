# 📋 Documentación de Scripts del Proyecto (SIMPLIFICADO)

## 🎯 **Resumen**
El proyecto ahora incluye **4 scripts esenciales** para la gestión completa de la base de datos y datos de prueba. Sistema completo y optimizado para validación.

---

## 📂 **Scripts Disponibles (4 SCRIPTS)**

### **1. 🧹 `1-reset-database.js`**
**Propósito:** Limpia completamente la base de datos eliminando todos los datos y reiniciando secuencias.

**Funcionalidad:**
- Elimina TODOS los datos de todas las tablas
- Reinicia los AUTO_INCREMENT (secuencias) a 1
- Deja la base de datos completamente limpia
- ⚠️ **ADVERTENCIA:** Elimina TODOS los datos existentes

**Uso:**
```bash
node scripts/1-reset-database.js
```

**Cuándo usar:** Primer paso obligatorio para limpiar la base de datos antes de configurar datos nuevos.

---

### **2. 🏗️ `2-setup-basic-data.js`**
**Propósito:** Configura todos los datos básicos necesarios para que el sistema funcione.

**Funcionalidad:**
- Crea roles del sistema (administrador, almacenista, cuentadante, usuario, vigilante, coordinador)
- Crea sedes (Pescadero, Calzado, Comuneros)
- Crea ambientes para cada sede
- Crea marcas básicas (Genérico, HP, Dell, Lenovo, Samsung, Canon, Epson, Microsoft)
- Crea usuarios de prueba con contraseñas hasheadas
- Asigna roles y sedes a usuarios

**Usuarios creados (Documento / Contraseña):**
- **👑 Administrador:** 100001 / 100001 (Todas las sedes)
- **📋 Cuentadantes Pescadero:** 100002-100005 / (mismo número) (Sede Pescadero)
- **📋 Cuentadantes Calzado:** 100006-100009 / (mismo número) (Sede Calzado)
- **📋 Cuentadantes Comuneros:** 100010-100013 / (mismo número) (Sede Comuneros)
- **🎯 Coordinador Pescadero:** 100014 / 100014 (Sede Pescadero)
- **🎯 Coordinador Calzado:** 100015 / 100015 (Sede Calzado)
- **🎯 Coordinador Comuneros:** 100016 / 100016 (Sede Comuneros)
- **🛡️ Vigilante Pescadero:** 100017 / 100017 (Sede Pescadero)
- **🛡️ Vigilante Calzado:** 100018 / 100018 (Sede Calzado)
- **🛡️ Vigilante Comuneros:** 100019 / 100019 (Sede Comuneros)
- **📦 Almacenista:** 100020 / 100020 (Sede Calzado)
- **👤 Usuario Regular:** 100021 / 100021 (Sede Comuneros)

**Distribución por roles:**
- 1 Administrador (acceso completo)
- 12 Cuentadantes (4 por sede)
- 3 Coordinadores (1 por sede)
- 3 Vigilantes (1 por sede)
- 1 Almacenista (gestión de inventario)
- 1 Usuario regular (solicitudes)

**Uso:**
```bash
node scripts/2-setup-basic-data.js
```

**Cuándo usar:** Segundo paso obligatorio después del reset para configurar la estructura básica del sistema.

---

### **3. 📦 `3-create-test-inventory.js`**
**Propósito:** Crea inventario de prueba con bienes y asignaciones de cuentadantes.

**Funcionalidad:**
- Crea 105+ bienes de prueba de diferentes categorías:
  - 25 Computadores (PC de escritorio)
  - 20 Laptops (portátiles)
  - 15 Impresoras (multifuncionales)
  - 10 Proyectores (multimedia)
  - 8 Televisores (Smart TV)
  - 12 Escritorios (oficina)
  - 15 Sillas (ergonómicas)
- Asigna TODOS los bienes a cuentadantes según la sede (distribución equitativa)
- **4 cuentadantes por sede** para pruebas completas del sistema
- Crea estados iniciales (Disponible) para todos los bienes
- Distribuye bienes entre las 3 sedes

**Uso:**
```bash
node scripts/3-create-test-inventory.js
```

**Cuándo usar:** Tercer paso para crear inventario de prueba y poder hacer solicitudes en el sistema.

---

### **4. 📝 `4-create-test-requests.js`**
**Propósito:** Crea solicitudes de prueba en diferentes estados para validar todos los flujos del sistema.

**Funcionalidad:**
- Crea 30 solicitudes con distribución realista de estados:
  - **🟡 Pendientes** (8): Esperando aprobación de cuentadante
  - **🔵 Firmada por Cuentadante** (6): Esperando coordinador
  - **🟢 Aprobadas** (4): Esperando vigilante para salida
  - **📦 En Préstamo** (6): Bienes entregados, esperando devolución
  - **✅ Devueltas** (4): Proceso completado exitosamente
  - **🚫 Rechazadas** (2): Rechazadas en diferentes etapas con observaciones
- Genera firmas automáticas según el estado y flujo correcto
- Distribuye solicitudes entre las 3 sedes equitativamente
- Crea motivos realistas (Clase práctica, Evento institucional, Capacitación, etc.)
- Observaciones detalladas en rechazos con motivos específicos
- Fechas aleatorias de los últimos 30 días para historial realista
- Respeta las reglas de negocio (vigilante no rechaza, flujo termina en rechazo)

**Uso:**
```bash
node scripts/4-create-test-requests.js
```

**Cuándo usar:** Cuarto y último paso para crear solicitudes de prueba y validar todos los flujos del sistema.

---

## 🔄 **Flujo Obligatorio de Uso (SECUENCIAL)**

### **Opción 1: Configuración completa automática (RECOMENDADO):**
```bash
# Ejecuta los 4 scripts en secuencia automáticamente
pnpm run setup-complete
```

### **Opción 2: Configuración manual paso a paso:**
```bash
# PASO 1: Limpiar base de datos
pnpm run reset-db
# O: node scripts/1-reset-database.js

# PASO 2: Configurar datos básicos
pnpm run setup-basic
# O: node scripts/2-setup-basic-data.js

# PASO 3: Crear inventario de prueba
pnpm run create-inventory
# O: node scripts/3-create-test-inventory.js

# PASO 4: Crear solicitudes de prueba
pnpm run create-requests
# O: node scripts/4-create-test-requests.js
```

### **Scripts disponibles:**
- `pnpm run reset-db` - Ejecuta script 1 (reset database)
- `pnpm run setup-basic` - Ejecuta script 2 (setup basic data)
- `pnpm run create-inventory` - Ejecuta script 3 (create inventory)
- `pnpm run create-requests` - Ejecuta script 4 (create test requests)
- `pnpm run setup-complete` - Ejecuta los 4 scripts en secuencia

**⚠️ IMPORTANTE:** Los scripts DEBEN ejecutarse en orden secuencial (1→2→3→4). Cada script depende del anterior.

---

## 📊 **Resultado Final**

Después de ejecutar los 4 scripts tendrás un sistema completamente funcional:

### **📊 Estructura de datos creada:**
- ✅ **6 roles del sistema** (administrador, almacenista, cuentadante, coordinador, vigilante, usuario)
- ✅ **3 sedes completas** (Pescadero, Calzado, Comuneros) con 3 ambientes cada una
- ✅ **8 marcas básicas** (Genérico, HP, Dell, Lenovo, Samsung, Canon, Epson, Microsoft)
- ✅ **21 usuarios de prueba** distribuidos por roles y sedes
- ✅ **105+ bienes de inventario** (computadores, laptops, impresoras, proyectores, etc.)
- ✅ **TODOS los bienes asignados** a cuentadantes (distribución equitativa por sede)
- ✅ **30 solicitudes de prueba** en diferentes estados con historial realista
- ✅ **Firmas automáticas** generadas según el flujo correcto de cada solicitud
- ✅ **Estados iniciales** de todos los bienes (Disponible)

### **🎯 Sistema completamente listo para:**
- ✅ **Iniciar sesión** con credenciales secuenciales (documento = contraseña)
- ✅ **Ver solicitudes** en todos los estados según el rol del usuario
- ✅ **Validar restricciones de sede** (coordinadores/vigilantes solo su sede)
- ✅ **Probar flujo completo** de aprobaciones (usuario → cuentadante → coordinador → vigilante)
- ✅ **Verificar firmas y observaciones** en solicitudes rechazadas
- ✅ **Gestionar solicitudes** pendientes, aprobadas, rechazadas y devueltas
- ✅ **Probar múltiples cuentadantes** de la misma sede (4 por sede)
- ✅ **Administrar usuarios** y asignar roles/sedes (administrador)
- ✅ **Gestionar inventario** y asignaciones (almacenista)
- ✅ **Filtrar por estados específicos** según el rol (filtros optimizados)
- ✅ **Usar paginación** en todas las tablas (10 elementos por página)
- ✅ **Probar cancelaciones** con motivos obligatorios
- ✅ **Validar flujos de rechazo** con observaciones requeridas

### **📈 Estadísticas del sistema configurado:**
- **Usuarios por rol:** 1 admin + 12 cuentadantes + 3 coordinadores + 3 vigilantes + 1 almacenista + 1 usuario
- **Distribución por sede:** Pescadero (7 usuarios), Calzado (7 usuarios), Comuneros (7 usuarios)
- **Inventario:** 105+ bienes distribuidos equitativamente entre cuentadantes
- **Solicitudes:** 30 solicitudes con estados variados para probar todos los flujos
- **Historial realista:** Fechas de los últimos 30 días con estados no lineales

---

## ⚙️ **Configuración Requerida**

### **Variables de entorno (.env.local):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sena_bienes
DB_USER=postgres
DB_PASSWORD=tu_password
```

### **Dependencias necesarias:**
- `pg` - Cliente PostgreSQL
- `bcryptjs` - Para hashear contraseñas
- `dotenv` - Para variables de entorno

---

## 🚨 **Advertencias Importantes**

### **Script destructivo:**
- ⚠️ `1-reset-database.js` - **ELIMINA TODOS LOS DATOS**

### **Scripts seguros:**
- ✅ `2-setup-basic-data.js` - Solo inserta datos básicos
- ✅ `3-create-test-inventory.js` - Solo crea inventario de prueba
- ✅ `4-create-test-requests.js` - Solo crea solicitudes de prueba

---

## 📝 **Ventajas del Sistema Simplificado**

- **Menos confusión:** Solo 4 scripts esenciales
- **Flujo claro:** Orden secuencial obligatorio
- **Mantenimiento fácil:** Menos archivos que mantener
- **Funcionalidad completa:** Todo lo necesario para el sistema
- **Documentación clara:** Cada script tiene propósito específico

---

---

## 🎯 **Guía Rápida de Uso**

### **Para desarrolladores nuevos:**
```bash
# 1. Clona el repositorio
git clone https://github.com/kevin101022/Finalizando_Sena.git
cd Finalizando_Sena

# 2. Instala dependencias
pnpm install

# 3. Configura .env.local con tus credenciales PostgreSQL

# 4. Configuración automática completa
pnpm run setup-complete

# 5. Inicia el servidor
pnpm run dev
```

### **Para pruebas rápidas:**
- **Administrador:** 100001 / 100001 (gestión completa)
- **Coordinador Comuneros:** 100016 / 100016 (aprobaciones)
- **Usuario Regular:** 100021 / 100021 (solicitudes)

### **Para validar flujos:**
1. Inicia sesión como Usuario (100021)
2. Crea una solicitud de bienes
3. Cambia a Cuentadante (100010-100013) para aprobar
4. Cambia a Coordinador (100016) para aprobar definitivamente
5. Cambia a Vigilante (100019) para autorizar salida y entrada

---

**Última actualización:** Diciembre 11, 2024  
**Versión del proyecto:** 5.0.0 (Sistema Optimizado y Completo)  
**Estado:** ✅ Completamente funcional y documentado