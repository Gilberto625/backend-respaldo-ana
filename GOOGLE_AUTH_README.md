# Autenticación con Google OAuth 2.0

Este backend ahora incluye autenticación con Google OAuth 2.0 utilizando Passport.js.

## Configuración

Las credenciales de Google OAuth están configuradas en el archivo `.env`:

```env
GOOGLE_CLIENT_ID=840156484089-cjlud6ktv2kfi66b596c8tpg4c5sff65s.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:4000/api/usuarios/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

## Rutas de Autenticación

### 1. Iniciar sesión con Google
```
GET /api/usuarios/auth/google
```
Redirige al usuario a la página de inicio de sesión de Google.

**Uso desde el frontend:**
```javascript
// Redirigir al usuario a la página de Google
window.location.href = 'http://localhost:4000/api/usuarios/auth/google';
```

### 2. Callback de Google (automático)
```
GET /api/usuarios/auth/google/callback
```
Google redirige aquí después de que el usuario autoriza la aplicación.
Esta ruta procesa la autenticación y redirige al frontend con un token JWT.

**Redirección automática:**
```
http://localhost:3000/auth/callback?token=JWT_TOKEN_AQUI
```

### 3. Obtener información del usuario autenticado
```
GET /api/usuarios/auth/user
```
Devuelve la información del usuario actual si está autenticado.

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "nombre": "Usuario",
    "email": "usuario@gmail.com",
    "googleId": "google_user_id",
    "picture": "https://lh3.googleusercontent.com/...",
    "provider": "google",
    "verificado": true,
    "rol": "usuario"
  }
}
```

### 4. Cerrar sesión
```
GET /api/usuarios/auth/logout
```
Cierra la sesión del usuario.

## Flujo de Autenticación

1. **Usuario hace clic en "Iniciar sesión con Google"**
   ```javascript
   window.location.href = 'http://localhost:4000/api/usuarios/auth/google';
   ```

2. **Google autentica al usuario y redirige al callback**
   - El usuario autoriza la aplicación en Google
   - Google redirige a: `/api/usuarios/auth/google/callback`

3. **Backend procesa la autenticación**
   - Busca si el usuario ya existe por `googleId`
   - Si no existe, busca por `email`
   - Si no existe ninguno, crea un nuevo usuario
   - Genera un token JWT
   - Redirige al frontend con el token

4. **Frontend recibe el token**
   ```javascript
   // En tu componente de callback (ej: /auth/callback)
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const token = params.get('token');

     if (token) {
       // Guardar token en localStorage
       localStorage.setItem('token', token);

       // Redirigir al dashboard o página principal
       window.location.href = '/dashboard';
     }
   }, []);
   ```

5. **Usar el token para peticiones autenticadas**
   ```javascript
   // En tus peticiones API
   const response = await fetch('http://localhost:4000/api/usuarios/auth/user', {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('token')}`
     }
   });
   ```

## Modelo de Usuario

El modelo de Usuario ha sido actualizado para soportar Google OAuth:

```javascript
{
  nombre: String (requerido),
  ap: String (opcional - para usuarios de Google),
  am: String (opcional - para usuarios de Google),
  username: String (opcional - para usuarios de Google),
  email: String (requerido, único),
  password: String (opcional - para usuarios de Google),
  telefono: String (opcional - para usuarios de Google),
  preguntaSecreta: String (opcional - para usuarios de Google),
  respuestaSecreta: String (opcional - para usuarios de Google),
  rol: String (usuario/admin, default: "usuario"),
  verificado: Boolean (default: false, true para usuarios de Google),

  // Campos nuevos para Google OAuth
  googleId: String (único, para usuarios de Google),
  picture: String (URL de foto de perfil de Google),
  provider: String (local/google, default: "local")
}
```

## Ejemplo de Componente React

```jsx
import React, { useEffect, useState } from 'react';

// Componente de Login
function Login() {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:4000/api/usuarios/auth/google';
  };

  return (
    <div>
      <h1>Iniciar Sesión</h1>
      <button onClick={handleGoogleLogin}>
        Iniciar sesión con Google
      </button>
    </div>
  );
}

// Componente de Callback
function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      alert('Error en la autenticación');
      window.location.href = '/login';
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/dashboard';
    }
  }, []);

  return <div>Procesando autenticación...</div>;
}

// Hook para obtener usuario actual
function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:4000/api/usuarios/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}

export { Login, AuthCallback, useCurrentUser };
```

## Seguridad

- Las sesiones están configuradas con httpOnly cookies
- Los tokens JWT expiran en 7 días
- Las contraseñas se hashean con bcrypt (para usuarios locales)
- CORS está configurado para permitir solo el frontend especificado
- En producción, asegúrate de:
  - Usar HTTPS
  - Configurar `secure: true` en las cookies
  - Actualizar las URLs de callback en Google Cloud Console

## Configuración de Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+
4. Ve a "Credenciales" y crea credenciales de OAuth 2.0
5. Configura las URLs autorizadas:
   - **Orígenes autorizados**: `http://localhost:4000`
   - **URIs de redireccionamiento**: `http://localhost:4000/api/usuarios/auth/google/callback`
6. Copia el Client ID y Client Secret al archivo `.env`

## Solución de Problemas

### Error: "OAuth2Strategy requires a clientID option"
- Asegúrate de que las variables de entorno estén correctamente configuradas en `.env`
- Verifica que `dotenv.config()` se ejecute antes de importar otros módulos

### Error: "redirect_uri_mismatch"
- Verifica que la URL de callback en `.env` coincida con la configurada en Google Cloud Console
- Asegúrate de incluir el protocolo completo (http:// o https://)

### El usuario no se redirige después del login
- Verifica que `FRONTEND_URL` esté correctamente configurado en `.env`
- Revisa la consola del navegador para ver errores de CORS
