# Ministerio App - Gestión de Ministerio

## Descripción
Aplicación web para gestionar hermanos ministrantes, familias y compañerismos con base de datos en la nube.

## Características
- ✅ Gestión de hermanos ministrantes
- ✅ Asignación de familias
- ✅ Sistema de compañerismos (grupos de 2+ hermanos)
- ✅ Filtros por localidad (Santa cruz, Libertador 1, Palo negro)
- ✅ Búsqueda en tiempo real
- ✅ Drag & drop para reasignar familias
- ✅ Base de datos en la nube (sincronización automática)

## Despliegue en Render
1. Crear cuenta gratuita en MongoDB Atlas
2. Obtener connection string de MongoDB
3. Conectar repositorio a Render
4. Agregar MONGODB_URI como variable de entorno
5. Desplegar web service

## Uso Local
```bash
npm install
npm start
```

## Tecnologías
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Base de datos: MongoDB
- Hosting: Render