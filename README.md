# Ministerio App - Configuración MySQL

## Requisitos
- XAMPP o WAMP (Apache + MySQL + PHP)
- MySQL Workbench

## Configuración

### 1. Instalar XAMPP
- Descargar e instalar XAMPP
- Iniciar Apache y MySQL desde el panel de control

### 2. Crear Base de Datos
- Abrir MySQL Workbench
- Conectar a localhost (usuario: root, sin contraseña)
- Ejecutar el archivo `api/database.sql`

### 3. Configurar Proyecto
- Copiar la carpeta `ministerio-app` a `C:\xampp\htdocs\`
- Acceder a: `http://localhost/ministerio-app/`

### 4. Verificar Conexión
- Si hay errores, revisar `api/config.php`
- Ajustar usuario/contraseña de MySQL si es necesario

## Uso
- Los datos se guardan automáticamente en MySQL
- Funciona en múltiples PCs conectadas a la misma red
- Para acceso externo, configurar port forwarding en el router