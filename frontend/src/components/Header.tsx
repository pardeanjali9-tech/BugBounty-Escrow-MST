import React from "react";
import { Shield, ExternalLink, AlertTriangle, CheckCircle2, Wallet, ArrowUpRight } from "lucide-react";
import { CORAL_CONFIG } from "../config/coralConfig";
import { BridgeKeyWalletState } from "../types";

interface HeaderProps {
  wallet: BridgeKeyWalletState & {
    connect: () => Promise<void>;
    disconnect: () => void;
    switchToCoral: () => Promise<void>;
  };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBridgeKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  wallet,
  activeTab,
  setActiveTab,
  onOpenBridgeKeyModal,
}) => {
  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "dashboard", label: "Dashboard" },
    { id: "programs", label: "Programs" },
    { id: "submit", label: "Submit Report" },
    { id: "researcher", label: "Researcher" },
    { id: "reviewer", label: "Reviewer" },
    { id: "owner", label: "Owner" },
    { id: "activity", label: "Activity" },
    { id: "settings", label: "Diagnostics" },
  ];

  return (
    <header className="border-b border-ivory-300 bg-ivory-50 sticky top-0 z-40">
      {/* Top Protocol Status Bar */}
      <div className="bg-graphite-900 text-ivory-100 text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between border-b border-graphite-800 font-mono">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-mint-400">
            <span className="w-2 h-2 rounded-full bg-mint-400 animate-pulse"></span>
            {CORAL_CONFIG.networkName}
          </span>
          <span className="text-graphite-500">|</span>
          <span className="text-graphite-400">Chain ID: {CORAL_CONFIG.chainId} (0xd56b)</span>
          <span className="text-graphite-500 hidden md:inline">|</span>
          <span className="text-graphite-400 hidden md:inline">Osaka EVM Compatible</span>
        </div>

        <div className="flex items-center gap-4 text-graphite-300">
          <a
            href={CORAL_CONFIG.blockExplorer}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-coral-300 transition-colors flex items-center gap-1"
          >
            Coral Explorer <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={CORAL_CONFIG.faucetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-coral-300 transition-colors flex items-center gap-1 text-coral-400"
          >
            tMSTC Faucet <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("overview")}>
          <div className="w-9 h-9 rounded bg-graphite-900 flex items-center justify-center border border-graphite-700 text-coral-400 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl tracking-tight font-bold text-graphite-950">
                VEIL
              </span>
              <span className="text-2xs font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-coral-100 text-coral-600 font-semibold border border-coral-300">
                Escrow
              </span>
            </div>
            <p className="text-2xs font-mono text-graphite-500 uppercase tracking-wider">
              Private Vulnerability Disclosure Protocol
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                activeTab === item.id
                  ? "bg-graphite-900 text-ivory-50 font-semibold shadow-sm"
                  : "text-graphite-600 hover:text-graphite-900 hover:bg-ivory-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* BridgeKey Wallet Controls */}
        <div className="flex items-center gap-2">
          {wallet.isConnected && wallet.account ? (
            <div className="flex items-center gap-2">
              {/* Network Status Badge */}
              {wallet.isCorrectNetwork ? (
                <div className="hidden sm:flex items-center gap-1.5 text-2xs font-mono px-2.5 py-1 rounded bg-mint-100 border border-mint-300 text-mint-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Coral Verified</span>
                </div>
              ) : (
                <button
                  onClick={wallet.switchToCoral}
                  className="flex items-center gap-1.5 text-2xs font-mono px-2.5 py-1 rounded bg-coral-100 border border-coral-400 text-coral-600 animate-pulse font-semibold"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Switch to Coral</span>
                </button>
              )}

              {/* Account Pill */}
              <div className="flex items-center gap-2 bg-ivory-200 border border-ivory-400 rounded px-2.5 py-1 font-mono text-xs">
                <span className="font-semibold text-graphite-800">
                  {wallet.balance} {CORAL_CONFIG.nativeCurrency.symbol}
                </span>
                <span className="text-graphite-400">|</span>
                <span className="text-graphite-600">
                  {shortenAddress(wallet.account)}
                </span>
                <button
                  onClick={wallet.disconnect}
                  title="Disconnect BridgeKey"
                  className="text-graphite-400 hover:text-coral-500 ml-1 text-2xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                if (!wallet.isInstalled) {
                  onOpenBridgeKeyModal();
                } else {
                  wallet.connect();
                }
              }}
              disabled={wallet.isConnecting}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-graphite-900 hover:bg-graphite-800 text-ivory-50 text-xs font-mono font-medium shadow transition-all border border-graphite-700 disabled:opacity-50"
            >
              <Wallet className="w-3.5 h-3.5 text-coral-400" />
              <span>
                {wallet.isConnecting ? "Connecting..." : "Connect BridgeKey"}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

