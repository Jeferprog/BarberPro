import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:suporte@barberpro.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function importVapidKeys() {
  const rawPrivate = base64UrlDecode(VAPID_PRIVATE_KEY);
  const rawPublic = base64UrlDecode(VAPID_PUBLIC_KEY);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    createPkcs8(rawPrivate, rawPublic),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  return privateKey;
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createPkcs8(privateRaw: Uint8Array, publicRaw: Uint8Array): ArrayBuffer {
  const pkcs8Prefix = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const mid = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00]);
  const result = new Uint8Array(pkcs8Prefix.length + privateRaw.length + mid.length + publicRaw.length);
  result.set(pkcs8Prefix, 0);
  result.set(privateRaw, pkcs8Prefix.length);
  result.set(mid, pkcs8Prefix.length + privateRaw.length);
  result.set(publicRaw, pkcs8Prefix.length + privateRaw.length + mid.length);
  return result.buffer;
}

async function createJwt(audience: string, privateKey: CryptoKey): Promise<string> {
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ aud: audience, exp: now + 86400, sub: VAPID_SUBJECT }))
  );
  const input = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(input)
  );

  const sigBytes = new Uint8Array(signature);
  const r = sigBytes.slice(0, 32);
  const s = sigBytes.slice(32, 64);
  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  return `${input}.${base64UrlEncode(rawSig.buffer)}`;
}

async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ encrypted: ArrayBuffer; salt: Uint8Array; serverPublicKey: ArrayBuffer }> {
  const userPublicKey = base64UrlDecode(p256dhKey);
  const userAuth = base64UrlDecode(authSecret);

  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPublicKeyRaw = await crypto.subtle.exportKey("raw", serverKeys.publicKey);

  const importedUserKey = await crypto.subtle.importKey("raw", userPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = await crypto.subtle.deriveBits({ name: "ECDH", public: importedUserKey }, serverKeys.privateKey, 256);

  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prk = await hkdfSha256(new Uint8Array(sharedSecret), userAuth, authInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyInfo = createInfo("aesgcm", userPublicKey, new Uint8Array(serverPublicKeyRaw));
  const contentEncryptionKey = await hkdfSha256(prk, salt, keyInfo, 16);

  const nonceInfo = createInfo("nonce", userPublicKey, new Uint8Array(serverPublicKeyRaw));
  const nonce = await hkdfSha256(prk, salt, nonceInfo, 12);

  const importedKey = await crypto.subtle.importKey("raw", contentEncryptionKey, { name: "AES-GCM" }, false, ["encrypt"]);

  const paddedPayload = new Uint8Array(2 + new TextEncoder().encode(payload).length);
  paddedPayload.set([0, 0], 0);
  paddedPayload.set(new TextEncoder().encode(payload), 2);

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, importedKey, paddedPayload);

  return { encrypted, salt, serverPublicKey: serverPublicKeyRaw };
}

function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const header = new TextEncoder().encode(`Content-Encoding: ${type}\0P-256\0`);
  const result = new Uint8Array(header.length + 2 + clientPublicKey.length + 2 + serverPublicKey.length);
  let offset = 0;
  result.set(header, offset);
  offset += header.length;
  result[offset++] = 0;
  result[offset++] = clientPublicKey.length;
  result.set(clientPublicKey, offset);
  offset += clientPublicKey.length;
  result[offset++] = 0;
  result[offset++] = serverPublicKey.length;
  result.set(serverPublicKey, offset);
  return result;
}

async function hkdfSha256(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prkBuf = await crypto.subtle.sign("HMAC", key, salt);
  const prkKey = await crypto.subtle.importKey("raw", prkBuf, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = new Uint8Array(info.length + 1);
  infoWithCounter.set(info, 0);
  infoWithCounter[info.length] = 1;
  const result = await crypto.subtle.sign("HMAC", prkKey, infoWithCounter);
  return new Uint8Array(result).slice(0, length);
}

async function sendPushNotification(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  privateKey: CryptoKey
): Promise<boolean> {
  try {
    const payloadStr = JSON.stringify(payload);
    const { encrypted, salt, serverPublicKey } = await encryptPayload(payloadStr, sub.p256dh, sub.auth);

    const url = new URL(sub.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await createJwt(audience, privateKey);

    const response = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aesgcm",
        "Crypto-Key": `dh=${base64UrlEncode(serverPublicKey)};p256ecdsa=${VAPID_PUBLIC_KEY}`,
        Authorization: `WebPush ${jwt}`,
        Encryption: `salt=${base64UrlEncode(salt.buffer)}`,
        TTL: "86400",
      },
      body: encrypted,
    });

    return response.ok || response.status === 201;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subscriptions, title, body, data } = await req.json();

    if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
      return new Response(JSON.stringify({ error: "No subscriptions provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateKey = await importVapidKeys();
    const payload = { title, body, data, tag: `barberpro-${Date.now()}` };

    const results = await Promise.allSettled(
      subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
        sendPushNotification(sub, payload, privateKey)
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;

    return new Response(JSON.stringify({ sent, total: subscriptions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
