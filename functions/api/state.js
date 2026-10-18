export async function onRequestGet(context) {
  var kv = context.env.NEON_KV;
  var hidden = [], adjust = {};
  if (kv) {
    try { hidden = JSON.parse(await kv.get('neon_hidden') || '[]'); } catch (e) {}
    try { adjust = JSON.parse(await kv.get('neon_adjust') || '{}'); } catch (e) {}
  }
  return new Response(JSON.stringify({ hidden: hidden, adjust: adjust }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
