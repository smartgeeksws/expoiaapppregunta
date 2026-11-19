const key = 'expoia:dos-horas:palabras';
const ignored = new Set('a al algo ante como con de del donde el en es esa ese esta este esto ha hasta hay la las le les lo los me mi mis muy no nos o para pero por porque que se si sin sobre son su sus te tu tus un una uno y yo'.split(' '));
const memory = globalThis.expoiaWords ??= new Map();

async function redis(command) {
  const { url, token } = redisConfig();
  if (!url || !token) throw new Error('Redis requiere URL y token');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Redis no está disponible');
  const data = await response.json();
  if (data.error) throw new Error('Falló el comando de Redis');
  return data.result;
}

function redisConfig() {
  const {
    UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
    KV_REST_API_URL, KV_REST_API_TOKEN,
  } = process.env;
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    return { url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN };
  }
  return { url: KV_REST_API_URL, token: KV_REST_API_TOKEN };
}

function local() {
  const { url, token } = redisConfig();
  return !process.env.VERCEL && !url && !token
    && !process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_TOKEN;
}

export async function GET() {
  try {
    let words;
    if (local()) {
      words = [...memory].map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, 'es')).slice(0, 32);
    } else {
      const pairs = await redis(['ZREVRANGE', key, 0, 31, 'WITHSCORES']);
      words = [];
      for (let i = 0; i < pairs.length; i += 2) words.push({ word: pairs[i], count: Number(pairs[i + 1]) });
    }
    return Response.json({ words }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'La nube no está disponible.' }, { status: 503 });
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const answer = body?.answer;
  if (typeof answer !== 'string' || !answer.trim() || answer.length > 160) {
    return Response.json({ error: 'Escribe una respuesta de hasta 160 caracteres.' }, { status: 400 });
  }
  const tokens = answer.normalize('NFC').toLocaleLowerCase('es').match(/\p{L}+/gu) ?? [];
  const words = [...new Set(tokens.filter(word => word.length > 1 && !ignored.has(word)))];
  if (!words.length) {
    return Response.json({ error: 'Incluye al menos una palabra que describa tu idea.' }, { status: 400 });
  }
  try {
    if (local()) {
      for (const word of words) memory.set(word, (memory.get(word) ?? 0) + 1);
    } else {
      const script = 'for _, word in ipairs(ARGV) do redis.call("ZINCRBY", KEYS[1], 1, word) end return 1';
      await redis(['EVAL', script, 1, key, ...words]);
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'No pudimos guardar tu respuesta. Inténtalo de nuevo.' }, { status: 503 });
  }
}
