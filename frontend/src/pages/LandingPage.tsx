import React from "react";
import {
  ShieldCheck,
  Lock,
  Coins,
  FileCheck2,
  Terminal,
  ArrowRight,
  Cpu,
  KeyRound,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { CORAL_CONFIG } from "../config/coralConfig";

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onConnectWallet: () => void;
  isConnected: boolean;
  totalEscrow: string;
  activeProgramsCount: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onConnectWallet,
  isConnected,
  totalEscrow,
  activeProgramsCount,
}) => {
  return (
    <div className="space-y-16 py-8">
      {/* Editorial Hero Section */}
      <section className="border-b border-ivory-300 pb-16">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-coral-100 border border-coral-300 text-coral-600 font-mono text-2xs uppercase tracking-widest font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-coral-500"></span>
            Forensic Vulnerability Disclosure Protocol &bull; MST Coral Testnet
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-graphite-950 leading-[1.1]">
            Cryptographically sealed disclosure. Guaranteed escrow settlement.
          </h1>

          <p className="font-sans text-base sm:text-lg text-graphite-600 leading-relaxed max-w-3xl">
            VEIL is a privacy-first decentralized bug bounty exchange. Security researchers encrypt
            vulnerability evidence locally in the browser, register verifiable commitments on the{" "}
            <strong>MST Coral Testnet</strong>, and claim escrowed rewards via smart-contract pull payments
            without disclosing plaintext details on-chain.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onNavigate("submit")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-graphite-900 hover:bg-graphite-800 text-ivory-50 text-xs font-mono font-semibold shadow transition-all border border-graphite-700"
            >
              <span>Submit Encrypted Report</span>
              <ArrowRight className="w-3.5 h-3.5 text-coral-400" />
            </button>

            <button
              onClick={() => onNavigate("programs")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-ivory-200 hover:bg-ivory-300 text-graphite-800 text-xs font-mono font-medium border border-ivory-400 transition-colors"
            >
              <span>Browse Bounty Programs ({activeProgramsCount})</span>
            </button>

            {!isConnected && (
              <button
                onClick={onConnectWallet}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-mono text-coral-600 hover:text-coral-700 font-semibold"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Connect BridgeKey Wallet</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Forensic Metrics Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-ivory-200 font-mono">
          <div className="p-4 rounded bg-ivory-100 border border-ivory-300">
            <div className="text-2xs uppercase text-graphite-500 tracking-wider">Escrow Locked</div>
            <div className="text-xl font-bold text-graphite-900 mt-1">
              {totalEscrow} <span className="text-xs text-coral-600 font-normal">{CORAL_CONFIG.nativeCurrency.symbol}</span>
            </div>
            <div className="text-2xs text-graphite-400 mt-0.5">Native Coral Escrow</div>
          </div>

          <div className="p-4 rounded bg-ivory-100 border border-ivory-300">
            <div className="text-2xs uppercase text-graphite-500 tracking-wider">Active Programs</div>
            <div className="text-xl font-bold text-graphite-900 mt-1">{activeProgramsCount}</div>
            <div className="text-2xs text-graphite-400 mt-0.5">Verified Smart Contracts</div>
          </div>

          <div className="p-4 rounded bg-ivory-100 border border-ivory-300">
            <div className="text-2xs uppercase text-graphite-500 tracking-wider">EVM Network</div>
            <div className="text-xl font-bold text-graphite-900 mt-1">Coral</div>
            <div className="text-2xs text-mint-500 mt-0.5">Chain ID: {CORAL_CONFIG.chainId} (0xd56b)</div>
          </div>

          <div className="p-4 rounded bg-ivory-100 border border-ivory-300">
            <div className="text-2xs uppercase text-graphite-500 tracking-wider">Approved Wallet</div>
            <div className="text-xl font-bold text-graphite-900 mt-1">BridgeKey</div>
            <div className="text-2xs text-graphite-400 mt-0.5">Exclusive Provider</div>
          </div>
        </div>
      </section>

      {/* Forensic Architecture Grid */}
      <section className="space-y-8">
        <div className="flex items-baseline justify-between border-b border-ivory-300 pb-3">
          <div>
            <h2 className="font-serif text-2xl font-bold text-graphite-950">
              Protocol Architecture
            </h2>
            <p className="text-xs font-mono text-graphite-500 mt-0.5">
              Verified on-chain state machine &bull; Client-side authenticated encryption
            </p>
          </div>
          <span className="text-2xs font-mono text-graphite-400 uppercase tracking-widest hidden sm:inline">
            Specification 1.0
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded bg-ivory-100 border border-ivory-300 space-y-4">
            <div className="w-10 h-10 rounded bg-graphite-900 text-coral-400 flex items-center justify-center border border-graphite-700">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-graphite-900">
              Zero Plaintext On-Chain
            </h3>
            <p className="text-xs text-graphite-600 leading-relaxed font-sans">
              Vulnerability details, proof-of-concept exploits, and encryption keys never touch the
              blockchain in plaintext. Reports are encrypted locally using AES-256-GCM. Only a canonical
              hash commitment (bytes32) is registered on Coral Testnet.
            </p>
            <div className="pt-2 font-mono text-2xs text-graphite-400 border-t border-ivory-200">
              <code>Commitment: keccak256(canonicalJson)</code>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded bg-ivory-100 border border-ivory-300 space-y-4">
            <div className="w-10 h-10 rounded bg-graphite-900 text-mint-400 flex items-center justify-center border border-graphite-700">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-graphite-900">
              Reserved Escrow Funds
            </h3>
            <p className="text-xs text-graphite-600 leading-relaxed font-sans">
              When a report is approved, the contract reserves the bounty reward immediately. Program
              owners cannot withdraw reserved funds owed to researchers. Payouts are settled through
              reentrancy-guarded pull-payment claims.
            </p>
            <div className="pt-2 font-mono text-2xs text-graphite-400 border-t border-ivory-200">
              <code>Available = TotalFunded - Reserved - Paid</code>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded bg-ivory-100 border border-ivory-300 space-y-4">
            <div className="w-10 h-10 rounded bg-graphite-900 text-coral-300 flex items-center justify-center border border-graphite-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-graphite-900">
              BridgeKey Exclusivity
            </h3>
            <p className="text-xs text-graphite-600 leading-relaxed font-sans">
              All transactions are signed via <strong>BridgeKey Wallet</strong> on the official{" "}
              <strong>MST Coral Testnet</strong> (Chain ID 54635). In compliance with protocol mandates,
              unsupported networks or third-party wallets are rejected.
            </p>
            <div className="pt-2 font-mono text-2xs text-graphite-400 border-t border-ivory-200">
              <code>Provider: window.bridgekey / Osaka EVM</code>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol State Machine Visualizer */}
      <section className="bg-graphite-950 text-ivory-100 rounded-lg p-6 sm:p-8 space-y-6 border border-graphite-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-coral-400 font-mono text-2xs uppercase tracking-widest font-semibold">
            <Terminal className="w-4 h-4" />
            <span>On-Chain State Machine & Verification Flow</span>
          </div>
          <h3 className="font-serif text-2xl font-bold tracking-tight">
            End-to-End Bug Bounty Lifecycle
          </h3>
        </div>

        {/* Steps Flowchart */}
        <div className="grid sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded bg-graphite-900 border border-graphite-800 space-y-2">
            <div className="flex items-center justify-between text-graphite-400 text-2xs">
              <span>STATE 0</span>
              <span className="text-coral-400 font-bold">SUBMITTED</span>
            </div>
            <p className="text-ivory-200 text-2xs leading-relaxed font-sans">
              Researcher encrypts report locally, stores ciphertext off-chain, registers bytes32 commitment on Coral.
            </p>
          </div>

          <div className="p-4 rounded bg-graphite-900 border border-graphite-800 space-y-2">
            <div className="flex items-center justify-between text-graphite-400 text-2xs">
              <span>STATE 1</span>
              <span className="text-yellow-400 font-bold">UNDER REVIEW</span>
            </div>
            <p className="text-ivory-200 text-2xs leading-relaxed font-sans">
              Authorized reviewer fetches ciphertext, unwraps key, verifies commitment integrity, inspects findings.
            </p>
          </div>

          <div className="p-4 rounded bg-graphite-900 border border-graphite-800 space-y-2">
            <div className="flex items-center justify-between text-graphite-400 text-2xs">
              <span>STATE 2 / 3</span>
              <span className="text-mint-400 font-bold">APPROVED / REJECTED</span>
            </div>
            <p className="text-ivory-200 text-2xs leading-relaxed font-sans">
              Reviewer approves and locks reward from escrow. If rejected, researcher may file a single formal appeal.
            </p>
          </div>

          <div className="p-4 rounded bg-graphite-900 border border-graphite-800 space-y-2">
            <div className="flex items-center justify-between text-graphite-400 text-2xs">
              <span>STATE 5</span>
              <span className="text-coral-400 font-bold">CLAIMED</span>
            </div>
            <p className="text-ivory-200 text-2xs leading-relaxed font-sans">
              Researcher signs pull-payment transaction via BridgeKey. Escrow transfers tMSTC directly to researcher.
            </p>
          </div>
        </div>

        <div className="p-4 rounded bg-graphite-900/60 border border-graphite-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-graphite-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-mint-400" />
            <span>Checks-Effects-Interactions &bull; Reentrancy Guard &bull; Nonce Expiry Replay Protection</span>
          </div>
          <button
            onClick={() => onNavigate("settings")}
            className="text-coral-400 hover:text-coral-300 inline-flex items-center gap-1 font-semibold"
          >
            Inspect Network Diagnostics <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};

