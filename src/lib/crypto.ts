// E2EE using Web Crypto API (X25519 for Key Exchange, AES-GCM for Encryption)

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, // Using P-256 for browser compatibility
    true,
    ["deriveKey"]
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return window.crypto.subtle.importKey(
    "spki",
    bytes,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

export async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(key: CryptoKey, text: string): Promise<{ iv: string, content: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return {
    iv: btoa(String.fromCharCode(...iv)),
    content: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  };
}

export async function decryptMessage(key: CryptoKey, ivBase64: string, contentBase64: string): Promise<string> {
  const iv = new Uint8Array(atob(ivBase64).split("").map(c => c.charCodeAt(0)));
  const content = new Uint8Array(atob(contentBase64).split("").map(c => c.charCodeAt(0)));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    content
  );
  return new TextDecoder().decode(decrypted);
}
