import sodium from "libsodium-wrappers";
import { savePrivateKey, getPrivateKey } from "./indexedDB";
import { axiosInstance } from "./axios";

// Cache for partner public keys to avoid excessive API requests
const publicKeyCache = {};

/**
 * Initializes libsodium. Must be called/awaited before crypto operations.
 */
export const initCrypto = async () => {
  await sodium.ready;
};

/**
 * Generates an X25519 keypair, registers public key on backend,
 * and saves private key locally in IndexedDB.
 */
export const generateAndRegisterKeys = async (userId) => {
  await initCrypto();

  // Generate keypair
  const keypair = sodium.crypto_kx_keypair();
  const publicKeyHex = sodium.to_hex(keypair.publicKey);
  const privateKeyHex = sodium.to_hex(keypair.privateKey);

  // Store private key locally
  await savePrivateKey(userId, privateKeyHex);

  // Register public key on backend
  await axiosInstance.put("/auth/register-key", { publicKey: publicKeyHex });

  return publicKeyHex;
};

/**
 * Fetches another user's public key (cached or from API).
 */
export const fetchUserPublicKey = async (userId) => {
  if (publicKeyCache[userId]) return publicKeyCache[userId];

  try {
    const res = await axiosInstance.get(`/auth/public-key/${userId}`);
    const pubKey = res.data.publicKey;
    if (pubKey) {
      publicKeyCache[userId] = pubKey;
    }
    return pubKey;
  } catch (error) {
    console.error(`Failed to fetch public key for user ${userId}:`, error);
    return null;
  }
};

/**
 * Derives a shared symmetric key (32 bytes) between two users
 * using X25519 DH (scalarmult) and GenericHash.
 */
const deriveSharedKey = (myPrivateKeyHex, partnerPublicKeyHex) => {
  const myPriv = sodium.from_hex(myPrivateKeyHex);
  const partnerPub = sodium.from_hex(partnerPublicKeyHex);

  // Compute X25519 shared secret
  const sharedSecret = sodium.crypto_scalarmult(myPriv, partnerPub);

  // Hash it to generate a 32-byte key for secretbox
  const derivedKey = sodium.crypto_generichash(sodium.crypto_secretbox_KEYBYTES, sharedSecret);
  return derivedKey;
};

/**
 * Encrypts a message text.
 * Returns { cipherText (hex), nonce (hex) }
 */
export const encryptMessage = async (text, myUserId, partnerUserId) => {
  await initCrypto();

  // Get my private key
  const myPrivateKeyHex = await getPrivateKey(myUserId);
  if (!myPrivateKeyHex) {
    // If key got cleared, regenerate them
    console.warn("My private key not found. Generating new keys...");
    const myPubKey = await generateAndRegisterKeys(myUserId);
    // Fetch partner public key
    const partnerPubKey = await fetchUserPublicKey(partnerUserId);
    if (!partnerPubKey) return { cipherText: null, nonce: null };
    return encryptMessage(text, myUserId, partnerUserId);
  }

  // Get partner public key
  const partnerPublicKeyHex = await fetchUserPublicKey(partnerUserId);
  if (!partnerPublicKeyHex) {
    console.error("Cannot encrypt: Partner has no public key");
    return { cipherText: null, nonce: null };
  }

  // Derive shared key
  const sharedKey = deriveSharedKey(myPrivateKeyHex, partnerPublicKeyHex);

  // Generate unique nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  // Symmetrically encrypt
  const cipherBytes = sodium.crypto_secretbox_easy(text, nonce, sharedKey);

  return {
    cipherText: sodium.to_hex(cipherBytes),
    nonce: sodium.to_hex(nonce),
  };
};

/**
 * Decrypts an encrypted message.
 * Returns decrypted string or falls back/error msg.
 */
export const decryptMessage = async (cipherTextHex, nonceHex, myUserId, partnerUserId) => {
  if (!cipherTextHex || !nonceHex) return "[Unencrypted Legacy Message]";

  await initCrypto();

  const myPrivateKeyHex = await getPrivateKey(myUserId);
  if (!myPrivateKeyHex) {
    return "[Decryption failed: Private key missing]";
  }

  const partnerPublicKeyHex = await fetchUserPublicKey(partnerUserId);
  if (!partnerPublicKeyHex) {
    return "[Decryption failed: Partner public key missing]";
  }

  try {
    const sharedKey = deriveSharedKey(myPrivateKeyHex, partnerPublicKeyHex);
    const ciphertext = sodium.from_hex(cipherTextHex);
    const nonce = sodium.from_hex(nonceHex);

    const decryptedBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, sharedKey);
    return sodium.to_string(decryptedBytes);
  } catch (error) {
    console.error("Decryption error:", error);
    return "[Decryption failed: decryption error]";
  }
};
