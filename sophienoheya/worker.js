const ADMIN_PASSWORD_KEY = 'admin_password';
const WORKS_KEY = 'works';
const VIDEOS_KEY = 'videos';
const DEFAULT_PASSWORD = 'sophienoheya2024';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function verifyAuth(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  const storedPw = (await env.SOPHIE_DATA.get(ADMIN_PASSWORD_KEY)) || DEFAULT_PASSWORD;
  return token === storedPw;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // GET /api/works
    if (request.method === 'GET' && path === '/api/works') {
      const data = await env.SOPHIE_DATA.get(WORKS_KEY);
      return json(data ? JSON.parse(data) : []);
    }

    // GET /api/videos
    if (request.method === 'GET' && path === '/api/videos') {
      const data = await env.SOPHIE_DATA.get(VIDEOS_KEY);
      return json(data ? JSON.parse(data) : []);
    }

    // POST /api/login
    if (request.method === 'POST' && path === '/api/login') {
      const body = await request.json();
      const storedPw = (await env.SOPHIE_DATA.get(ADMIN_PASSWORD_KEY)) || DEFAULT_PASSWORD;
      if (body.password === storedPw) {
        return json({ ok: true, token: storedPw });
      }
      return json({ ok: false }, 401);
    }

    // POST /api/works
    if (request.method === 'POST' && path === '/api/works') {
      if (!(await verifyAuth(request, env))) return json({ error: 'Unauthorized' }, 401);
      const body = await request.json();
      await env.SOPHIE_DATA.put(WORKS_KEY, JSON.stringify(body));
      return json({ ok: true });
    }

    // POST /api/videos
    if (request.method === 'POST' && path === '/api/videos') {
      if (!(await verifyAuth(request, env))) return json({ error: 'Unauthorized' }, 401);
      const body = await request.json();
      await env.SOPHIE_DATA.put(VIDEOS_KEY, JSON.stringify(body));
      return json({ ok: true });
    }

    // POST /api/password
    if (request.method === 'POST' && path === '/api/password') {
      if (!(await verifyAuth(request, env))) return json({ error: 'Unauthorized' }, 401);
      const body = await request.json();
      if (!body.newPassword) return json({ error: 'Missing newPassword' }, 400);
      await env.SOPHIE_DATA.put(ADMIN_PASSWORD_KEY, body.newPassword);
      return json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  },
};
