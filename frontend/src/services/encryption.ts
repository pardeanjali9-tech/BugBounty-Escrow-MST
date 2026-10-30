import { ethers } from "ethers";
import { VulnerabilityPlaintext } from "../types";

export interface EncryptionResult {
  ciphertextBase64: string;
  ivBase64: string;
  wrappedKeyBase64: string;
  commitment: string; // 32-byte hex commitment (bytes32 for smart contract)
  sha256Hash: string;
  canonicalJson: string;
}

export class VeilEncryptionService {
  /**
   * Serializes vulnerability data canonically with deterministic sorted keys.
   */
  static canonicalize(data: VulnerabilityPlaintext): string {
    const keys = Object.keys(data).sort();
    const sortedObj: Record<string, any> = {};
    for (const key of keys) {
      sortedObj[key] = (data as any)[key];
    }
    return JSON.stringify(sortedObj);
  }

  /**
   * Generates a 32-byte cryptographic commitment over canonical payload.
   * Format: 0x... (EVM bytes32 compatible)
   */
  static computeCommitment(canonicalJson: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(canonicalJson));
  }

  /**
   * Generates a cryptographically random 16-byte nonce in hex format.
   */
  static generateNonce(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return ethers.hexlify(array);
  }

  /**
   * Encrypts vulnerability data locally using AES-256-GCM authenticated encryption.
   */
  static async encryptReport(
    report: VulnerabilityPlaintext,
    reviewerKeyMaterial?: string
  ): Promise<EncryptionResult> {
    const canonicalJson = this.canonicalize(report);
    const commitment = this.computeCommitment(canonicalJson);

    // 1. Generate AES-GCM 256-bit key
    const aesKey = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    // 2. Generate 12-byte IV (standard for AES-GCM)
    const iv = new Uint8Array(12);
    window.crypto.getRandomValues(iv);

    // 3. Encrypt canonical UTF-8 bytes
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(canonicalJson);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      encodedData
    );

    // 4. Export raw AES key to wrap it for the reviewer
    const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const rawKeyArray = new Uint8Array(rawAesKey);

    // Reviewer Key Wrapping (Symmetric or Public Key wrapper)
    // For reviewer authorization, we wrap the raw AES key with reviewer secret/key material
    const wrappedKeyBytes = this.wrapAesKey(rawKeyArray, reviewerKeyMaterial || "VEIL_DEFAULT_REVIEWER_KEY_V1");

    // Compute SHA-256 fingerprint of ciphertext
    const ciphertextArray = new Uint8Array(encryptedBuffer);
    const sha256Hash = ethers.sha256(ciphertextArray);

    return {
      ciphertextBase64: this.bytesToBase64(ciphertextArray),
      ivBase64: this.bytesToBase64(iv),
      wrappedKeyBase64: this.bytesToBase64(wrappedKeyBytes),
      commitment,
      sha256Hash,
      canonicalJson,
    };
  }

  /**
   * Decrypts ciphertext and verifies cryptographic integrity against on-chain commitment.
   */
  static async decryptAndVerifyReport(
    ciphertextBase64: string,
    ivBase64: string,
    wrappedKeyBase64: string,
    expectedOnChainCommitment: string,
    reviewerKeyMaterial?: string
  ): Promise<{
    verified: boolean;
    report: VulnerabilityPlaintext;
    computedCommitment: string;
  }> {
    const ciphertextBytes = this.base64ToBytes(ciphertextBase64);
    const ivBytes = this.base64ToBytes(ivBase64);
    const wrappedKeyBytes = this.base64ToBytes(wrappedKeyBase64);

    // 1. Unwrap AES key
    const rawAesKey = this.unwrapAesKey(
      wrappedKeyBytes,
      reviewerKeyMaterial || "VEIL_DEFAULT_REVIEWER_KEY_V1"
    );

    // 2. Import raw AES key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      rawAesKey as unknown as BufferSource,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // 3. Decrypt ciphertext using AES-GCM
    let decryptedBuffer: ArrayBuffer;
    try {
      decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ivBytes as unknown as BufferSource,
        },
        aesKey,
        ciphertextBytes as unknown as BufferSource
      );
    } catch (e: any) {
      throw new Error("Cryptographic decryption failed: Invalid key, corrupted ciphertext, or authentication tag mismatch.");
    }

    const decoder = new TextDecoder();
    const canonicalJson = decoder.decode(decryptedBuffer);

    // 4. Verify Cryptographic Integrity
    const computedCommitment = this.computeCommitment(canonicalJson);

    if (
      computedCommitment.toLowerCase() !==
      expectedOnChainCommitment.toLowerCase()
    ) {
      throw new Error(
        `INTEGRITY BREACH DETECTED: Computed commitment (${computedCommitment}) does not match the verified on-chain commitment (${expectedOnChainCommitment}). This report may have been tampered with!`
      );
    }

    const report: VulnerabilityPlaintext = JSON.parse(canonicalJson);

    return {
      verified: true,
      report,
      computedCommitment,
    };
  }

  // Key wrapping helpers (XOR with HKDF / Keccak-derived reviewer stream for clean wrapping)
  private static wrapAesKey(rawKey: Uint8Array, reviewerMaterial: string): Uint8Array {
    const pad = ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes(reviewerMaterial)));
    const wrapped = new Uint8Array(rawKey.length);
    for (let i = 0; i < rawKey.length; i++) {
      wrapped[i] = rawKey[i] ^ pad[i % pad.length];
    }
    return wrapped;
  }

  private static unwrapAesKey(wrappedKey: Uint8Array, reviewerMaterial: string): Uint8Array {
    return this.wrapAesKey(wrappedKey, reviewerMaterial); // symmetric unwrap
  }

  private static bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private static base64ToBytes(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
