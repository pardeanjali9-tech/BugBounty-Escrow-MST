import { Router, Request, Response } from "express";
import { coralRpcService } from "../services/coralRpcService";
import { storageService } from "../services/storageService";
import { coralConfig } from "../config/coralConfig";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const rpcHealth = await coralRpcService.checkRpcHealth();

  const status = {
    service: "VEIL BugBounty Escrow Backend API",
    status: rpcHealth.reachable ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    network: {
      name: coralConfig.networkName,
      chainId: coralConfig.chainId,
      chainIdHex: coralConfig.chainIdHex,
      rpcUrl: coralConfig.rpcUrls.http,
      explorerUrl: coralConfig.blockExplorer,
      faucetUrl: coralConfig.faucetUrl,
      supportedWallet: coralConfig.wallet.supportedWallet,
      rpcConnectivity: rpcHealth,
    },
    storage: {
      status: "operational",
      totalEncryptedReports: storageService.getTotalReportsCount(),
    },
  };

  res.status(rpcHealth.reachable ? 200 : 503).json(status);
});

export default router;

