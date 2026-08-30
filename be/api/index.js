// Vercel serverless entry — adapts Fastify app to the Vercel Node.js function API.
import { buildApp } from '../src/server.js';

let readyPromise = null;
const appPromise = () => (readyPromise ??= buildApp({ logger: false }));

export default async function handler(req, res) {
  const app = await appPromise();
  await app.ready;
  app.routing(req, res);
}
