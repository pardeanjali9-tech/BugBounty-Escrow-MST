import { Router, Request, Response } from "express";
import { storageService, EncryptedReportPayload } from "../services/storageService";
import { ethers } from "ethers";

const router = Router();

/**
 * POST /api/storage/encrypted-report
 * Accepts and securely stores encrypted report ciphertext.
 * Strictly verifies that plaintext is NOT accepted.
 */
router.post("/encrypted-report", async (req: Request, res: Response) => {
  try {
    const body: EncryptedReportPayload = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid request body format. Expected JSON." });
    }

    if (!body.programId || typeof body.programId !== "number") {
      return res.status(400).json({ error: "programId is required and must be a number." });
    }

    if (!body.researcher || !ethers.isAddress(body.researcher)) {
      return res.status(400).json({ error: "researcher must be a valid EVM address." });
    }

    if (!body.commitment || !ethers.isHexString(body.commitment, 32)) {
      return res.status(400).json({
        error: "commitment must be a valid 32-byte hex string (bytes32).",
      });
    }

    if (!body.ciphertext || typeof body.ciphertext !== "string") {
      return res.status(400).json({ error: "ciphertext is required." });
    }

    if (!body.iv || typeof body.iv !== "string") {
      return res.status(400).json({ error: "iv (initialization vector) is required." });
    }

    if (!body.wrappedKey || typeof body.wrappedKey !== "string") {
      return res.status(400).json({ error: "wrappedKey is required for authorized reviewer decryption." });
    }

    // Save encrypted blob
    const stored = await storageService.storeEncryptedReport(body);

    return res.status(201).json({
      success: true,
      message: "Encrypted report stored successfully.",
      storageRef: stored.storageRef,
      id: stored.id,
      sha256Fingerprint: stored.sha256Fingerprint,
      storedAt: stored.storedAt,
    });
  } catch (error: any) {
    console.error("Storage error:", error.message);
    return res.status(500).json({
      error: error.message || "Failed to store encrypted report",
    });
  }
});

/**
 * GET /api/storage/encrypted-report/:id
 * Retrieves authorized encrypted report ciphertext by ID or storage reference.
 */
router.get("/encrypted-report/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Report storage ID is required." });
    }

    const report = await storageService.getEncryptedReport(id);
    if (!report) {
      return res.status(404).json({ error: "Encrypted report not found." });
    }

    // Return the ciphertext, IV, wrapped key, and public metadata
    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to retrieve encrypted report",
    });
  }
});

export default router;

