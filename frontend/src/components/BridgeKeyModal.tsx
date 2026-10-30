import React from "react";
import { ShieldAlert, ExternalLink, X, KeyRound, AlertTriangle, Cpu } from "lucide-react";
import { CORAL_CONFIG } from "../config/coralConfig";

interface BridgeKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryConnect: () => void;
  detectedError: string | null;
}

export const BridgeKeyModal: React.FC<BridgeKeyModalProps> = ({
  isOpen,
  onClose,
  onRetryConnect,
  detectedError,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-ivory-50 border border-ivory-300 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden text-graphite-900">
        {/* Header */}
        <div className="bg-graphite-900 text-ivory-100 p-5 flex items-start justify-between border-b border-graphite-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-graphite-800 border border-graphite-700 text-coral-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">BridgeKey Wallet Required</h3>
              <p className="text-2xs font-mono text-graphite-400">
                Native MST Blockchain Non-Custodial Provider
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-graphite-400 hover:text-ivory-100 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {detectedError && (
            <div className="p-3.5 rounded bg-coral-50 border border-coral-300 text-coral-700 flex items-start gap-2.5 font-mono">
              <AlertTriangle className="w-4 h-4 text-coral-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-2xs uppercase tracking-wider">Connection Notice</p>
                <p className="mt-0.5 text-xs">{detectedError}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-mono text-2xs uppercase font-bold text-graphite-600 tracking-wider">
              Protocol Constraint
            </h4>
            <p className="text-graphite-700 leading-relaxed">
              VEIL operates exclusively on the <strong>MST Coral Testnet</strong> using{" "}
              <strong>BridgeKey Wallet</strong>. In accordance with platform security specifications,
              generic wallets (MetaMask, Coinbase Wallet, WalletConnect) or foreign networks
              (Sepolia, Mainnet) are <strong>not supported as fallbacks</strong>.
            </p>
          </div>

          {/* Network Specs Box */}
          <div className="bg-ivory-100 border border-ivory-300 rounded p-3.5 space-y-2 font-mono text-2xs">
            <div className="flex items-center gap-1.5 font-bold text-graphite-800 pb-1 border-b border-ivory-200">
              <Cpu className="w-3.5 h-3.5 text-coral-500" />
              <span>Target Network Architecture</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-graphite-700">
              <div>
                <span className="text-graphite-400 block">Network:</span>
                <span className="font-semibold">{CORAL_CONFIG.networkName}</span>
              </div>
              <div>
                <span className="text-graphite-400 block">Chain ID:</span>
                <span className="font-semibold">{CORAL_CONFIG.chainId} ({CORAL_CONFIG.chainIdHex})</span>
              </div>
              <div className="col-span-2">
                <span className="text-graphite-400 block">RPC Endpoint:</span>
                <span className="font-semibold select-all text-2xs">{CORAL_CONFIG.rpcUrls.http}</span>
              </div>
              <div>
                <span className="text-graphite-400 block">Gas Token:</span>
                <span className="font-semibold">{CORAL_CONFIG.nativeCurrency.symbol} (18 decimals)</span>
              </div>
              <div>
                <span className="text-graphite-400 block">Explorer:</span>
                <span className="font-semibold text-coral-600">coral.mstscan.com</span>
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <div className="space-y-2.5">
            <h4 className="font-mono text-2xs uppercase font-bold text-graphite-600 tracking-wider">
              Setup Instructions
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-graphite-700 leading-relaxed font-sans">
              <li>
                Install the official <strong>BridgeKey Extension</strong> from{" "}
                <a
                  href="https://bridgekey.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coral-600 underline font-semibold inline-flex items-center gap-0.5"
                >
                  bridgekey.io <ExternalLink className="w-2.5 h-2.5" />
                </a>.
              </li>
              <li>
                In BridgeKey, switch or add network to <strong>MST Coral Testnet</strong> (Chain ID 54635).
              </li>
              <li>
                Acquire testnet tokens via the{" "}
                <a
                  href={CORAL_CONFIG.faucetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coral-600 underline font-semibold inline-flex items-center gap-0.5"
                >
                  Coral Faucet <ExternalLink className="w-2.5 h-2.5" />
                </a>.
              </li>
              <li>Return to VEIL and click <strong>Connect BridgeKey</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-ivory-200 border-t border-ivory-300 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-mono text-graphite-600 hover:text-graphite-900"
          >
            Dismiss
          </button>
          <div className="flex gap-2">
            <a
              href="https://bridgekey.io"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded text-xs font-mono border border-graphite-400 text-graphite-800 hover:bg-ivory-300 transition-colors"
            >
              Get BridgeKey
            </a>
            <button
              onClick={() => {
                onRetryConnect();
                onClose();
              }}
              className="px-4 py-1.5 rounded bg-graphite-900 hover:bg-graphite-800 text-ivory-50 text-xs font-mono font-semibold transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

