import React, { useState, useEffect } from "react";
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  KeyRound,
  Server,
  Lock,
} from "lucide-react";
import { CORAL_CONFIG, ESCROW_CONTRACT_ADDRESS } from "../config/coralConfig";
import { VeilApiService } from "../services/api";
import { BridgeKeyWalletState } from "../types";

interface SettingsViewProps {
  wallet: BridgeKeyWalletState;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ wallet }) => {
  const [healthStatus, setHealthStatus] = useState<any | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const fetchDiagnostics = async () => {
    setCheckingHealth(true);
    try {
      const data = await VeilApiService.getHealth();
      setHealthStatus(data);
    } catch (err: any) {
      setHealthStatus({
        status: "offline",
        error: err.message,
      });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="space-y-8 py-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory-300 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-graphite-950 font-sans">
            Network & System Diagnostics
          </h1>
          <p className="text-xs text-graphite-500 mt-1">
            Verification parameters for MST Coral Testnet & BridgeKey integration
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          disabled={checkingHealth}
          className="px-3.5 py-1.5 rounded bg-ivory-200 border border-ivory-400 text-graphite-800 hover:bg-ivory-300 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-coral-600 ${checkingHealth ? "animate-spin" : ""}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Network Specification Box */}
        <div className="p-5 rounded bg-ivory-100 border border-ivory-300 space-y-4">
          <div className="flex items-center justify-between border-b border-ivory-200 pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-coral-600" />
              <h3 className="font-serif text-base font-bold text-graphite-900 font-sans">
                Verified Coral Testnet Specs
              </h3>
            </div>
            <span className="text-2xs text-mint-700 bg-mint-100 px-2 py-0.5 rounded border border-mint-300 font-bold">
              Verified
            </span>
          </div>

          <div className="space-y-2 text-2xs">
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">Network Name:</span>
              <span className="font-bold text-graphite-900">{CORAL_CONFIG.networkName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">Chain ID:</span>
              <span className="font-bold text-graphite-900">
                {CORAL_CONFIG.chainId} ({CORAL_CONFIG.chainIdHex})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">Gas Token:</span>
              <span className="font-bold text-graphite-900">
                {CORAL_CONFIG.nativeCurrency.name} ({CORAL_CONFIG.nativeCurrency.symbol})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">HTTP RPC:</span>
              <span className="text-graphite-800 select-all">{CORAL_CONFIG.rpcUrls.http}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">WebSocket RPC:</span>
              <span className="text-graphite-800 select-all">{CORAL_CONFIG.rpcUrls.ws}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">Block Explorer:</span>
              <a
                href={CORAL_CONFIG.blockExplorer}
                target="_blank"
                rel="noopener noreferrer"
                className="text-coral-600 underline flex items-center gap-1 font-bold"
              >
                coral.mstscan.com <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">Official Faucet:</span>
              <a
                href={CORAL_CONFIG.faucetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-coral-600 underline flex items-center gap-1 font-bold"
              >
                coral-faucet.mstblockchain.com <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-graphite-500">Escrow Contract:</span>
              <span className="text-2xs text-graphite-800 select-all break-all">
                {ESCROW_CONTRACT_ADDRESS}
              </span>
            </div>
          </div>
        </div>

        {/* Live Backend & RPC Health */}
        <div className="p-5 rounded bg-ivory-100 border border-ivory-300 space-y-4">
          <div className="flex items-center justify-between border-b border-ivory-200 pb-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-mint-600" />
              <h3 className="font-serif text-base font-bold text-graphite-900 font-sans">
                Backend & RPC Connectivity
              </h3>
            </div>
            <span
              className={`text-2xs px-2 py-0.5 rounded border font-bold ${
                healthStatus?.status === "healthy"
                  ? "bg-mint-100 text-mint-700 border-mint-300"
                  : "bg-red-100 text-red-700 border-red-300"
              }`}
            >
              {healthStatus?.status || "Checking..."}
            </span>
          </div>

          {healthStatus ? (
            <div className="space-y-2 text-2xs">
              <div className="flex justify-between py-1 border-b border-ivory-200">
                <span className="text-graphite-500">Service:</span>
                <span className="font-bold text-graphite-900">{healthStatus.service || "VEIL API"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-ivory-200">
                <span className="text-graphite-500">Coral RPC Reachable:</span>
                <span className="font-bold text-mint-600">
                  {healthStatus.network?.rpcConnectivity?.reachable ? "TRUE (Online)" : "FALSE"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-ivory-200">
                <span className="text-graphite-500">Latest Block on Coral:</span>
                <span className="font-bold text-graphite-900">
                  #{healthStatus.network?.rpcConnectivity?.blockNumber || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-ivory-200">
                <span className="text-graphite-500">RPC Latency:</span>
                <span className="font-bold text-graphite-900">
                  {healthStatus.network?.rpcConnectivity?.latencyMs || 0} ms
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-ivory-200">
                <span className="text-graphite-500">Encrypted Storage:</span>
                <span className="font-bold text-graphite-900">
                  {healthStatus.storage?.totalEncryptedReports || 0} ciphertexts indexed
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-graphite-500">Backend Uptime:</span>
                <span className="text-graphite-700">{healthStatus.uptimeSeconds || 0}s</span>
              </div>
            </div>
          ) : (
            <p className="text-graphite-500">Checking backend service status...</p>
          )}
        </div>

        {/* BridgeKey Integration Status */}
        <div className="p-5 rounded bg-ivory-100 border border-ivory-300 space-y-4">
          <div className="flex items-center justify-between border-b border-ivory-200 pb-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-coral-600" />
              <h3 className="font-serif text-base font-bold text-graphite-900 font-sans">
                BridgeKey Wallet State
              </h3>
            </div>
            <span className="text-2xs text-graphite-500">EIP-1193 / EIP-6963</span>
          </div>

          <div className="space-y-2 text-2xs">
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">Extension Injected:</span>
              <span className={`font-bold ${wallet.isInstalled ? "text-mint-600" : "text-yellow-600"}`}>
                {wallet.isInstalled ? "Detected (Ready)" : "Not Detected"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">Connection Status:</span>
              <span className={`font-bold ${wallet.isConnected ? "text-mint-600" : "text-graphite-500"}`}>
                {wallet.isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">Connected Account:</span>
              <span className="font-mono text-graphite-800 break-all">
                {wallet.account || "None"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-200">
              <span className="text-graphite-500">Active Chain ID:</span>
              <span className={`font-bold ${wallet.isCorrectNetwork ? "text-mint-600" : "text-coral-600"}`}>
                {wallet.chainId ? `${wallet.chainId}` : "—"}{" "}
                {wallet.isCorrectNetwork ? "(Coral 54635 Match)" : "(Wrong Network)"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-graphite-500">Coral Balance:</span>
              <span className="font-bold text-graphite-900">{wallet.balance} tMSTC</span>
            </div>
          </div>
        </div>

        {/* Privacy & Cryptography Audit */}
        <div className="p-5 rounded bg-ivory-100 border border-ivory-300 space-y-4">
          <div className="flex items-center justify-between border-b border-ivory-200 pb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-graphite-800" />
              <h3 className="font-serif text-base font-bold text-graphite-900 font-sans">
                Privacy Architecture
              </h3>
            </div>
            <span className="text-2xs text-mint-700 bg-mint-100 px-2 py-0.5 rounded border border-mint-300 font-bold">
              Hardened
            </span>
          </div>

          <ul className="space-y-2 text-2xs text-graphite-700 leading-relaxed font-sans list-disc list-inside">
            <li>
              <strong>Client-Side AES-256-GCM:</strong> Encrypted in browser memory via native Web Crypto API.
            </li>
            <li>
              <strong>Zero Plaintext Storage:</strong> Server receives only ciphertext, nonce, and IV.
            </li>
            <li>
              <strong>Verifiable Commitments:</strong> Canonical JSON string hash is registered on-chain as a tamper-evident commitment.
            </li>
            <li>
              <strong>EVM Osaka Compatibility:</strong> Compatible with Shanghai/Osaka EVM opcode specifications on MST Coral Testnet.
            </li>
            <li>
              <strong>Pull-Payment Escrow:</strong> Bounty rewards are claimed directly by researcher addresses via reentrancy-guarded transactions.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

