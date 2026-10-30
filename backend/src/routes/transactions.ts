import { Router, Request, Response } from "express";
import { coralRpcService } from "../services/coralRpcService";

const router = Router();

/**
 * GET /api/transactions/:hash
 * Inspect transaction status on MST Coral Testnet via verified RPC.
 */
router.get("/:hash", async (req: Request, res: Response) => {
  const { hash } = req.params;

  try {
    const txInfo = await coralRpcService.getTransactionReceipt(hash);

    if (!txInfo) {
      return res.status(404).json({
        error: "Transaction not found on MST Coral Testnet. It may still be propagating or invalid.",
      });
    }

    return res.status(200).json({
      success: true,
      transaction: txInfo,
    });
  } catch (err: any) {
    return res.status(400).json({
      error: err.message || "Failed to inspect Coral transaction",
    });
  }
});

export default router;

