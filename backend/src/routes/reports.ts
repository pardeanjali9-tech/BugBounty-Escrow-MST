import { Router, Request, Response } from "express";
import { storageService } from "../services/storageService";
import { ethers } from "ethers";

const router = Router();

/**
 * GET /api/reports/:id
 * Retrieve encrypted report metadata and storage details.
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const report = await storageService.getEncryptedReport(id);

  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  // Return public metadata and encrypted reference without revealing unauthorized content
  return res.status(200).json({
    success: true,
    report: {
      id: report.id,
      storageRef: report.storageRef,
      programId: report.programId,
      researcher: report.researcher,
      commitment: report.commitment,
      metadata: report.metadata,
      storedAt: report.storedAt,
      sha256Fingerprint: report.sha256Fingerprint,
    },
  });
});

/**
 * GET /api/reports/program/:programId
 * List reports filed under a specific program.
 */
router.get("/program/:programId", async (req: Request, res: Response) => {
  const programId = parseInt(req.params.programId, 10);
  if (isNaN(programId)) {
    return res.status(400).json({ error: "Invalid programId format." });
  }

  const list = await storageService.getReportsByProgram(programId);
  return res.status(200).json({
    success: true,
    total: list.length,
    reports: list.map((r) => ({
      id: r.id,
      storageRef: r.storageRef,
      programId: r.programId,
      researcher: r.researcher,
      commitment: r.commitment,
      metadata: r.metadata,
      storedAt: r.storedAt,
    })),
  });
});

/**
 * GET /api/reports/researcher/:address
 * List reports filed by a specific researcher.
 */
router.get("/researcher/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid EVM researcher address format." });
  }

  const list = await storageService.getReportsByResearcher(address);
  return res.status(200).json({
    success: true,
    total: list.length,
    reports: list.map((r) => ({
      id: r.id,
      storageRef: r.storageRef,
      programId: r.programId,
      researcher: r.researcher,
      commitment: r.commitment,
      metadata: r.metadata,
      storedAt: r.storedAt,
    })),
  });
});

export default router;

