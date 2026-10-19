# PaintRooms

Aplicació web col·laborativa que permet a diversos usuaris dibuixar en temps real sobre un canvas compartit, organitzats en sales.

## Descripció

Cada usuari tria un nom i entra (o crea) una sala. Dins de la sala, tots els participants veuen en temps real els traços que es dibuixen i la posició del cursor dels altres usuaris. En entrar a una sala existent, es recupera automàticament l'estat actual del canvas.

## Tecnologies

| Capa | Tecnologia |
|---|---|
| Frontend | Vue 3 (SPA, Composition API) |
| Temps real | Socket.IO |
| Backend | Node.js + Express + Socket.IO |
| Bundler | Vite |
| Contenidors | Docker + Docker Compose |

## Estructura del projecte

```
PaintRooms/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── base.css
│   │   │   ├── main.css
│   │   │   └── logo.svg
│   │   ├── components/
│   │   │   ├── icons/
│   │   │   │   └── BrandIcon.vue
│   │   │   ├── RoomForm.vue
│   │   │   └── RoomList.vue
│   │   ├── composables/
│   │   │   └── usePaintRoom.js
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   └── AboutView.vue
│   │   ├── App.vue
│   │   ├── App.css
│   │   └── main.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Arrancar el projecte en local

Necessites tenir instal·lat **Docker** i **Docker Compose**.

```bash
docker compose up -d
```

Això aixeca dos contenidors:
- `paintrooms-backend` → API i servidor Socket.IO
- `paintrooms-frontend` → SPA servida per Vite

Per aturar-los:

```bash
docker compose down
```

## URLs

| Servei | URL |
|---|---|
| Aplicació (frontend) | http://localhost:5173 |
| Backend / API | http://localhost:3000 |

## Com funciona

1. Obre http://localhost:5173
2. Escriu el teu nom i el nom d'una sala
3. Prem **Entrar / crear sala**
4. Dibuixa al canvas mantenint premut el botó del ratolí
5. Obre un segon navegador amb la mateixa URL i uneix-te a la mateixa sala per veure la col·laboració en temps real

## Autor

**Kim Z. Galicio Lamar**
