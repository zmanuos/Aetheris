# Aetheris

---

## Frontend

### Instalación

Para tener el frontend funcionando, sigue estos pasos:

1.  **Versión de Node.js**: Asegúrate de tener Node.js `v22.14.0` instalado.
2.  **Navega**: Abre tu terminal y ve al directorio `Aetheris`.
3.  **Instala Dependencias**: Ejecuta `npm install` para instalar todos los paquetes necesarios.

---

## Backend

### Requisitos
* **SDK de .NET 9.0**
* **MySQL 8.0+**

### Instalación

Configuracion del backend:

1.  **Clonar Repositorio**: Clona el repositorio.
2.  **Navega**: Cambia tu directorio a `BackendAetheris`.
3.  **Instalar Dependencias**: Ejecuta `dotnet restore` para instalar todas las dependencias del proyecto.
4.  **Configurar Base de Datos**: Abre `appsettings.json` y actualízalo con tus credenciales de la base de datos MySQL.
5.  **Aplicar Migraciones**: Ejecuta `dotnet ef database update` para aplicar las migraciones de la base de datos.
6.  **Ejecutar Aplicación**: Inicia el backend ejecutando `dotnet run`.

---

## Referencia Rápida: Cambios en el Backend

| Tipo de Cambio          | ¿Requiere Migración? | Comando                             |
| :---------------------- | :------------------- | :---------------------------------- |
| Añadir una columna      | SÍ                   | `dotnet ef migrations add AddColumn` |
| Modificar lógica        | NO                   | `dotnet run`                        |
| Añadir una nueva tabla  | SÍ                   | `dotnet ef migrations add AddTable` |
| Añadir un nuevo endpoint | NO                   | `dotnet run`                        |
| Cambiar tipo de dato    | SÍ                   | `dotnet ef migrations add ChangeType` |
| Modificar validaciones  | NO                   | `dotnet run`                        |

**Regla de Oro:** Si modificas algo en el directorio `Models/` que afecte la estructura de tu base de datos, necesitarás crear una nueva migración. Para cambios solo de lógica, simplemente vuelve a ejecutar la aplicación.
