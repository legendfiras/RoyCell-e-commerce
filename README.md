# RoyCell-e-commerce

## Local development

Install dependencies:

```bash
npm install
```

Run the API:

```bash
npm run server
```

Run the website:

```bash
npm run dev
```

Open `http://127.0.0.1:5173`.

## Deployment

Use one Node service for the API and website.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Required environment variables:

```bash
MONGODB_URI=<your MongoDB Atlas URI ending with /roycell>
JWT_SECRET=<long random secret, at least 32 characters>
ADMIN_SETUP_KEY=<private reset key, at least 24 characters>
PORT=4000
CLIENT_ORIGIN=<your deployed website URL>
```

After deployment, open `/admin` and sign in with the Mongo admin account.

### Vercel

The project includes `vercel.json`, so Vercel builds the Vite app and sends `/api/*` requests to serverless API functions.

In Vercel Project Settings, add these Environment Variables for Production:

```bash
MONGODB_URI=<your MongoDB Atlas URI ending with /roycell>
JWT_SECRET=<long random secret, at least 32 characters>
ADMIN_SETUP_KEY=<private reset key, at least 24 characters>
CLIENT_ORIGIN=https://your-vercel-domain.vercel.app
```

Then redeploy. Open `/api/health` first; it should show `"ok": true`. After that, open `/admin`.

## Debugging

Check API and MongoDB status:

```bash
GET /api/health
GET /api/mongo-ping
```

In the browser console, inspect recent API failures:

```js
window.royCellDebug.logs()
```

Clear saved API debug logs:

```js
window.royCellDebug.clear()
```
