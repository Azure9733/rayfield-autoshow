import { createApp } from './app';

// Local dev entry point only; tests import createApp directly and Vercel exports the app.
const port = Number(process.env.PORT ?? 3000);

createApp().listen(port, () => {
  console.info(`API listening on http://localhost:${port}`);
});
