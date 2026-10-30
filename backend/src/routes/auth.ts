import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import * as crypto from "crypto";

const router = Router();

// In-memory nonce store with 5-minute expiry
interface NonceEntry {
  nonce: string;
  createdAt: number;
}
const nonces: Map<string, NonceEntry> = new Map();

/**
 * GET /api/auth/challenge?address=0x...
 * Issues a cryptographic challenge string with a random nonce.
 */
router.get("/challenge", (req: Request, res: Response) => {
  const address = req.query.address as string;
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: "A valid EVM wallet address is required." });
  }

  const clean = address.toLowerCase();
  const nonce = crypto.randomBytes(16).toString("hex");
  nonces.set(clean, {
    nonce,
    createdAt: Date.now(),
  });

  const challengeMessage = `VEIL Security Exchange Authentication\nAddress: ${clean}\nNonce: ${nonce}\nTimestamp: ${Date.now()}\nAction: Authenticate session on MST Coral Testnet`;

  return res.status(200).json({
    success: true,
    address: clean,
    nonce,
    message: challengeMessage,
  });
});

/**
 * POST /api/auth/verify
 * Verifies signed message challenge using ethers.verifyMessage.
 */
router.post("/verify", (req: Request, res: Response) => {
  const { address, signature, message } = req.body;

  if (!address || !signature || !message) {
    return res.status(400).json({ error: "Missing required fields: address, signature, message." });
  }

  const clean = address.toLowerCase();
  const stored = nonces.get(clean);

  if (!stored) {
    return res.status(400).json({ error: "No pending authentication challenge for this address." });
  }

  // Check 5-minute expiry
  if (Date.now() - stored.createdAt > 5 * 60 * 1000) {
    nonces.delete(clean);
    return res.status(400).json({ error: "Authentication challenge expired. Request a new challenge." });
  }

  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== clean) {
      return res.status(401).json({ error: "Cryptographic signature verification failed." });
    }

    // Invalidate nonce to prevent replay attacks
    nonces.delete(clean);

    // Return session token or verification confirmation
    const sessionToken = crypto.randomBytes(32).toString("hex");

    return res.status(200).json({
      success: true,
      authenticated: true,
      address: clean,
      sessionToken,
    });
  } catch (err: any) {
    return res.status(400).json({ error: `Signature verification error: ${err.message}` });
  }
});

export default router;

