import React, { useState } from "react";
import { PlusCircle, Coins, ShieldCheck, ArrowRight, ExternalLink, X, AlertCircle } from "lucide-react";
import { Program } from "../types";
import { CORAL_CONFIG } from "../config/coralConfig";
import { ethers } from "ethers";

interface ProgramsViewProps {
  programs: Program[];
  onCreateProgram: (
    title: string,
    description: string,
    minRewardWei: bigint,
    maxRewardWei: bigint,
    allowsAppeal: boolean,
    initialDepositWei: bigint
  ) => Promise<any>;
  onFundProgram: (programId: number, amountWei: bigint) => Promise<any>;
  onSelectProgramForReport: (programId: number) => void;
  activeAccount: string | null;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({
  programs,
  onCreateProgram,
  onFundProgram,
  onSelectProgramForReport,
  activeAccount,
  isCreateOpen,
  setIsCreateOpen,
}) => {
  // Fund program modal state
  const [fundingProgramId, setFundingProgramId] = useState<number | null>(null);
  const [fundingAmount, setFundingAmount] = useState<string>("1.0");

  // Create program form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minReward, setMinReward] = useState("0.1");
  const [maxReward, setMaxReward] = useState("2.0");
  const [allowsAppeal, setAllowsAppeal] = useState(true);
  const [initialDeposit, setInitialDeposit] = useState("2.5");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Program title is required.");
      return;
    }

    try {
      setSubmitting(true);
      const minWei = ethers.parseEther(minReward);
      const maxWei = ethers.parseEther(maxReward);
      const depositWei = ethers.parseEther(initialDeposit || "0");

      if (minWei > maxWei) {
        setFormError("Minimum reward cannot exceed maximum reward.");
        setSubmitting(false);
        return;
      }

      await onCreateProgram(title, description, minWei, maxWei, allowsAppeal, depositWei);
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setFormError(err.message || "Failed to create bounty program on Coral.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingProgramId) return;

    try {
      const amountWei = ethers.parseEther(fundingAmount);
      await onFundProgram(fundingProgramId, amountWei);
      setFundingProgramId(null);
    } catch (err: any) {
      alert(`Funding failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory-300 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-graphite-950">
            Bug Bounty Programs
          </h1>
          <p className="text-xs font-mono text-graphite-500 mt-1">
            Escrow-backed disclosure scopes registered on MST Coral Testnet
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded bg-graphite-900 text-ivory-50 text-xs font-mono font-medium hover:bg-graphite-800 shadow transition-colors flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5 text-coral-400" />
          <span>New Bounty Program</span>
        </button>
      </div>

      {/* Program Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {programs.map((program) => {
          const isOwner =
            activeAccount &&
            program.owner.toLowerCase() === activeAccount.toLowerCase();

          return (
            <div
              key={program.id}
              className="bg-ivory-100 border border-ivory-300 rounded-lg p-5 flex flex-col justify-between shadow-sm space-y-4 hover:border-ivory-400 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-graphite-900 bg-ivory-200 px-2 py-0.5 rounded border border-ivory-300">
                      PROGRAM #{program.id}
                    </span>
                    {program.active ? (
                      <span className="text-2xs font-mono px-2 py-0.5 rounded bg-mint-100 border border-mint-300 text-mint-700 font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="text-2xs font-mono px-2 py-0.5 rounded bg-graphite-200 border border-graphite-300 text-graphite-600 font-semibold">
                        Closed
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-2xs text-graphite-500">
                    {program.allowsAppeal ? "Appeals Permitted" : "No Appeals"}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-graphite-950">
                  {program.title}
                </h3>

                <p className="text-xs text-graphite-600 font-sans leading-relaxed">
                  {program.description}
                </p>

                {/* Escrow Liquidity Breakdown */}
                <div className="bg-ivory-50 border border-ivory-300 rounded p-3 font-mono text-2xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-graphite-500">Available Escrow:</span>
                    <span className="font-bold text-mint-600 text-xs">
                      {program.availableFunds} {CORAL_CONFIG.nativeCurrency.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-graphite-600">
                    <span className="text-graphite-500">Reward Range:</span>
                    <span>
                      {program.minReward} &ndash; {program.maxReward} {CORAL_CONFIG.nativeCurrency.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-graphite-400 pt-1 border-t border-ivory-200">
                    <span>Program Owner:</span>
                    <span>
                      {program.owner.slice(0, 6)}...{program.owner.slice(-4)}
                      {isOwner && " (You)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-ivory-200">
                <button
                  onClick={() => onSelectProgramForReport(program.id)}
                  disabled={!program.active}
                  className="flex-1 px-3 py-2 rounded bg-graphite-900 text-ivory-50 text-xs font-mono font-medium hover:bg-graphite-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Submit Report</span>
                  <ArrowRight className="w-3.5 h-3.5 text-coral-400" />
                </button>

                <button
                  onClick={() => setFundingProgramId(program.id)}
                  disabled={!program.active}
                  className="px-3 py-2 rounded bg-ivory-200 text-graphite-800 text-xs font-mono font-medium hover:bg-ivory-300 border border-ivory-400 disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  <Coins className="w-3.5 h-3.5 text-coral-600" />
                  <span>Deposit Funds</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Program Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-ivory-50 border border-ivory-300 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden text-graphite-900">
            <div className="bg-graphite-900 text-ivory-100 p-4 flex items-center justify-between border-b border-graphite-800">
              <h3 className="font-serif text-lg font-bold">Launch Bug Bounty Program</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-graphite-400 hover:text-ivory-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs font-mono">
              {formError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-graphite-600 uppercase text-2xs mb-1 font-bold">
                  Program Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. DeFi Protocol Core Contracts"
                  required
                  className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700"
                />
              </div>

              <div>
                <label className="block text-graphite-600 uppercase text-2xs mb-1 font-bold">
                  Description & Audit Scope
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Define target contracts, security invariants, and disclosure guidelines..."
                  rows={3}
                  className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-graphite-600 uppercase text-2xs mb-1 font-bold">
                    Min Reward (tMSTC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={minReward}
                    onChange={(e) => setMinReward(e.target.value)}
                    required
                    className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700"
                  />
                </div>
                <div>
                  <label className="block text-graphite-600 uppercase text-2xs mb-1 font-bold">
                    Max Reward (tMSTC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={maxReward}
                    onChange={(e) => setMaxReward(e.target.value)}
                    required
                    className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-graphite-600 uppercase text-2xs mb-1 font-bold">
                  Initial Escrow Deposit (tMSTC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700"
                />
                <span className="text-2xs text-graphite-500 mt-1 block">
                  Funds are escrowed directly in BugBountyEscrow contract on MST Coral Testnet.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="allowsAppeal"
                  checked={allowsAppeal}
                  onChange={(e) => setAllowsAppeal(e.target.checked)}
                  className="rounded border-ivory-400 text-coral-600 focus:ring-coral-500"
                />
                <label htmlFor="allowsAppeal" className="text-xs text-graphite-700 cursor-pointer">
                  Allow researchers to appeal rejected vulnerability reports
                </label>
              </div>

              <div className="pt-4 border-t border-ivory-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-2 rounded text-graphite-600 hover:text-graphite-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-graphite-900 text-ivory-50 font-bold hover:bg-graphite-800 disabled:opacity-50"
                >
                  {submitting ? "Deploying on Coral..." : "Confirm & Deploy on Coral"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund Program Modal */}
      {fundingProgramId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-ivory-50 border border-ivory-300 rounded-lg max-w-sm w-full shadow-2xl overflow-hidden text-graphite-900">
            <div className="bg-graphite-900 text-ivory-100 p-4 flex items-center justify-between border-b border-graphite-800">
              <h3 className="font-serif text-base font-bold">Fund Program #{fundingProgramId}</h3>
              <button
                onClick={() => setFundingProgramId(null)}
                className="text-graphite-400 hover:text-ivory-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFundSubmit} className="p-5 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-graphite-600 uppercase text-2xs mb-1 font-bold">
                  Deposit Amount ({CORAL_CONFIG.nativeCurrency.symbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  required
                  className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700"
                />
              </div>

              <div className="p-3 bg-ivory-100 rounded border border-ivory-300 text-2xs text-graphite-600">
                Transaction will transfer native {CORAL_CONFIG.nativeCurrency.symbol} testnet tokens to
                the BugBountyEscrow contract via BridgeKey Wallet.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
                <button
                  type="button"
                  onClick={() => setFundingProgramId(null)}
                  className="px-3 py-1.5 rounded text-graphite-600 hover:text-graphite-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-graphite-900 text-ivory-50 font-bold hover:bg-graphite-800"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

