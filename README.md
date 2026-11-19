# Dos horas libres

La pantalla principal muestra el código QR y actualiza la nube cada dos segundos. El código lleva a `/responder` en el mismo dominio. Cada palabra cuenta una vez por respuesta. La nube muestra hasta 32 palabras.

## Desarrollo

```sh
npm ci
npm run dev
```

Abre `http://localhost:3000`. Sin Redis, las respuestas de prueba se guardan en memoria y se pierden al reiniciar el servidor.

## Vercel

Conecta un Redis de Upstash y configura `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en el entorno de producción del proyecto. Despliega de nuevo si las variables se agregaron después del primer despliegue. La pantalla y el formulario usan Redis para compartir las respuestas entre dispositivos.
