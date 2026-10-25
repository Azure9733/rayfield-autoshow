import { createApp } from './app';
import { env } from './config/env';

// Local dev entry point only; tests import createApp directly and Vercel exports the app.
createApp().listen(env.PORT, () => {
  console.info(`API listening on http://localhost:${env.PORT}`);
});
