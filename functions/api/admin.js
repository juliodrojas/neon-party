function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!a || a.length !== b.length) return false;
  var d = 0;
  for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
export async function onRequestPost(context) {
  var env = context.env;
  var body = {};
  try { body = await context.request.json(); } catch (e) { return json({ ok: false, error: 'bad json' }, 400); }
  if (!safeEqual(body.pin, env.ADMIN_PIN)) {
    return json({ ok: false, error: 'bad pin' }, 401);
  }
  if (body.action === 'verify') return json({ ok: true });
  var kv = env.NEON_KV;
  if (!kv) return json({ ok: false, error: 'no kv' }, 500);
  var id = String(body.id || '');
  if (!/^NP\/\d{3}$/.test(id)) return json({ ok: false, error: 'bad id' }, 400);
  if (body.action === 'hide' || body.action === 'unhide') {
    var hidden = [];
    try { hidden = JSON.parse(await kv.get('neon_hidden') || '[]'); } catch (e) {}
    if (body.action === 'hide') { if (hidden.indexOf(id) === -1) hidden.push(id); }
    else { hidden = hidden.filter(function (x) { return x !== id; }); }
    await kv.put('neon_hidden', JSON.stringify(hidden));
    return json({ ok: true, hidden: hidden });
  }
  if (body.action === 'adjust') {
    var adjust = {};
    try { adjust = JSON.parse(await kv.get('neon_adjust') || '{}'); } catch (e) {}
    var clamp = function (x, lo, hi) {
      x = parseInt(x, 10);
      if (isNaN(x)) x = 0;
      return Math.max(lo, Math.min(hi, x));
    };
    var obj = null;
    if (body.value !== null && typeof body.value === 'object') {
      obj = {
        lift: clamp(body.value.lift, -40, 60),
        contrast: clamp(body.value.contrast, -50, 50),
        sat: clamp(body.value.sat, -100, 100)
      };
      if (!obj.lift && !obj.contrast && !obj.sat) obj = null;
    } else {
      var v = clamp(body.value, -40, 60);
      if (v) obj = { lift: v, contrast: 0, sat: 0 };
    }
    if (obj) adjust[id] = obj; else delete adjust[id];
    await kv.put('neon_adjust', JSON.stringify(adjust));
    return json({ ok: true, adjust: adjust });
  }
  return json({ ok: false, error: 'bad action' }, 400);
}
