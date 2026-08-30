// Vercel serverless entry — adapts the Fastify app to the Vercel Node.js function API
// via app.inject (lightweight proxy; safe for the low traffic of this leaderboard API).
import { buildApp } from '../src/server.js';

let readyPromise = null;
const appPromise = () => (readyPromise ??= buildApp({ logger: false }));

export default async function handler(req, res) {
  const app = await appPromise();
  await app.ready;

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);

  const headers = { ...req.headers };
  delete headers['content-length'];
  delete headers['transfer-encoding'];

  let r;
  try {
    r = await app.inject({
      method: req.method,
      url: req.url,
      headers,
      payload: body.length ? body : undefined,
      remoteAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? '0.0.0.0',
    });
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: { code: 'INTERNAL', message: 'Lỗi server' } }));
    return;
  }

  res.statusCode = r.statusCode;
  for (const [k, v] of Object.entries(r.headers)) {
    if (k !== 'content-length' && k !== 'transfer-encoding' && k !== 'connection') res.setHeader(k, v);
  }
  res.end(r.rawPayload);
}
