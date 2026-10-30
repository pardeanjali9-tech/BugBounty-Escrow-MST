import { Router, Request, Response } from "express";
import { storageService } from "../services/storageService";

const router = Router();

// In-memory / persistent registry for program metadata
interface ProgramMetadata {
  id: number;
  title: string;
  description: string;
  policy: string;
  reviewerPublicKey: string; // Used by researchers to wrap AES keys
  owner: string;
  minRewardWei: string;
  maxRewardWei: string;
  allowsAppeal: boolean;
  createdAt: string;
}

const programsRegistry: Map<number, ProgramMetadata> = new Map();

// Seed initial protocol program metadata
programsRegistry.set(1, {
  id: 1,
  title: "VEIL Core Protocol & Escrow Smart Contracts",
  description: "Official security audit scope for BugBountyEscrow.sol, state machine invariants, and cryptographic commitment verifications on MST Coral Testnet.",
  policy: "Strict privacy disclosure required. Submit only authenticated encrypted ciphertext through BridgeKey Wallet on MST Coral Testnet.",
  reviewerPublicKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1vK8P1X8B0jO198y3nVEILDEFAULTKEY",
  owner: "0x1A8FbDE6F22eEa75A519c7f1a30aCe891b98B001",
  minRewardWei: "100000000000000000", // 0.1 tMSTC
  maxRewardWei: "2000000000000000000", // 2.0 tMSTC
  allowsAppeal: true,
  createdAt: new Date().toISOString(),
});

/**
 * GET /api/programs
 * List all available bug bounty programs.
 */
router.get("/", (req: Request, res: Response) => {
  const list = Array.from(programsRegistry.values());
  res.status(200).json({
    success: true,
    total: list.length,
    programs: list,
  });
});

/**
 * GET /api/programs/:id
 * Retrieve single program metadata and attached report count.
 */
router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid program ID format." });
  }

  const program = programsRegistry.get(id);
  if (!program) {
    return res.status(404).json({ error: "Program not found in registry." });
  }

  const reports = await storageService.getReportsByProgram(id);

  return res.status(200).json({
    success: true,
    program,
    metrics: {
      reportsCount: reports.length,
    },
  });
});

/**
 * POST /api/programs
 * Register newly created on-chain program metadata into backend registry.
 */
router.post("/", (req: Request, res: Response) => {
  const { id, title, description, policy, reviewerPublicKey, owner, minRewardWei, maxRewardWei, allowsAppeal } = req.body;

  if (!id || !title || !owner) {
    return res.status(400).json({ error: "Missing required fields: id, title, owner." });
  }

  const newProg: ProgramMetadata = {
    id: Number(id),
    title,
    description: description || "",
    policy: policy || "Standard responsible disclosure rules apply.",
    reviewerPublicKey: reviewerPublicKey || "DEFAULT_WORKSPACE_KEY",
    owner,
    minRewardWei: minRewardWei || "0",
    maxRewardWei: maxRewardWei || "0",
    allowsAppeal: Boolean(allowsAppeal),
    createdAt: new Date().toISOString(),
  };

  programsRegistry.set(newProg.id, newProg);

  return res.status(201).json({
    success: true,
    program: newProg,
  });
});

export default router;

