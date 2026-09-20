# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción         |
| --------- | -------------- |
| `←` `→`   | Rotar nave     |
| `↑`       | Propulsar      |
| `Espacio` | Disparar       |
| `Tab`     | Cambiar skin   |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad: al recogerlo (icono rombo cian), la nave se mueve el doble de rápido durante 5 segundos
- Power-up de escudo: protege la nave de colisiones durante 6 segundos
- Power-up de triple disparo: dispara tres proyectiles durante 5 segundos
- Sistema de skins: cambia el aspecto de la nave con `Tab` y conserva la selección al recargar

## Skins

| Skin      | Contorno |
| --------- | -------- |
| Clásico   | Blanco   |
| Neón      | Cian     |
| Rubí      | Rojo     |
| Ámbar     | Ámbar    |
| Fantasma  | Verde    |
| Violeta   | Magenta  |
