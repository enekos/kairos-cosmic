# Kairos

A photo network with no feed. Multi-page React app (Vite) + an empty backend
slot for future API work.

## Layout

```
.
├── frontend/      Vite + React 18 multi-page app
│   ├── index.html, about.html, kairos.html, legal.html, login.html, signup.html
│   └── src/       React entry, components, styles, mock data
├── backend/       Reserved — empty
└── .github/workflows/   CI + GitHub Pages deploy
```

## Develop

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

## Build

```bash
cd frontend
npm run build        # outputs to frontend/dist
npm run preview      # serve the built bundle locally
```

## Deploy

`master` pushes trigger `.github/workflows/deploy.yml`, which builds
`frontend/` and publishes `frontend/dist` to GitHub Pages.

Enable Pages in repo Settings → Pages → Source: GitHub Actions.
