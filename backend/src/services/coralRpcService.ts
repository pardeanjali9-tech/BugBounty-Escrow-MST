import { ethers } from "ethers";
import { coralConfig } from "../config/coralConfig";

export class CoralRpcService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(coralConfig.rpcUrls.http, {
      chainId: coralConfig.chainId,
      name: coralConfig.networkName,
    });
  }

  async checkRpcHealth(): Promise<{
    reachable: boolean;
    chainId: number;
    chainIdMatches: boolean;
    blockNumber: number;
    latencyMs: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      const [network, blockNumber] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber(),
      ]);

      const chainId = Number(network.chainId);
      const latencyMs = Date.now() - start;

      return {
        reachable: true,
        chainId,
        chainIdMatches: chainId === coralConfig.chainId,
        blockNumber,
        latencyMs,
      };
    } catch (err: any) {
      return {
        reachable: false,
        chainId: 0,
        chainIdMatches: false,
        blockNumber: 0,
        latencyMs: Date.now() - start,
        error: err.message || "Failed to reach MST Coral RPC endpoint",
      };
    }
  }

  async getTransactionReceipt(txHash: string): Promise<any | null> {
    if (!ethers.isHexString(txHash, 32)) {
      throw new Error("Invalid transaction hash format. Must be a 32-byte hex string (0x...)");
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        // Check if transaction is pending
        const tx = await this.provider.getTransaction(txHash);
        if (tx) {
          return {
            hash: txHash,
            status: "pending",
            blockNumber: null,
            confirmations: 0,
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            explorerUrl: `${coralConfig.blockExplorer}/tx/${txHash}`,
          };
        }
        return null;
      }

      return {
        hash: receipt.hash,
        status: receipt.status === 1 ? "success" : "reverted",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        from: receipt.from,
        to: receipt.to,
        contractAddress: receipt.contractAddress,
        explorerUrl: `${coralConfig.blockExplorer}/tx/${txHash}`,
      };
    } catch (err: any) {
      throw new Error(`Coral RPC query error: ${err.message}`);
    }
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
}

export const coralRpcService = new CoralRpcService();

