import React, { useState } from "react";
import {
  Coins,
  Shield,
  UserPlus,
  UserMinus,
  Lock,
  AlertTriangle,
  ArrowDownLeft,
  X,
  PowerOff,
  CheckCircle2,
} from "lucide-react";
import { Program } from "../types";
import { CORAL_CONFIG } from "../config/coralConfig";
import { ethers } from "ethers";

interface OwnerWorkspaceProps {
  programs: Program[];
  activeAccount: string | null;
  onSetReviewer: (programId: number, reviewer: string, authorized: boolean) => Promise<any>;
  onCloseProgram: (programId: number) => Promise<any>;
  onWithdrawFunds: (programId: number, amountWei: bigint) => Promise<any>;
  onFundProgram: (programId: number, amountWei: bigint) => Promise<any>;
}

export const OwnerWorkspace: React.FC<OwnerWorkspaceProps> = ({
  programs,
  activeAccount,
  onSetReviewer,
  onCloseProgram,
  onWithdrawFunds,
  onFundProgram,
}) => {
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [newReviewerAddress, setNewReviewerAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("1.0");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isUpdatingReviewer, setIsUpdatingReviewer] = useState(false);

  // Filter programs owned by user or show all if local demo
  const ownedPrograms = activeAccount
    ? programs.filter(
        (p) => p.owner.toLowerCase() === activeAccount.toLowerCase()
      )
    : programs;

  const currentProgram =
    programs.find((p) => p.id === selectedProgramId) || ownedPrograms[0] || programs[0];

  const handleAddReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProgram || !newReviewerAddress.trim()) return;

    if (!ethers.isAddress(newReviewerAddress.trim())) {
      alert("Please enter a valid EVM address.");
      return;
    }

    try {
      setIsUpdatingReviewer(true);
      await onSetReviewer(currentProgram.id, newReviewerAddress.trim(), true);
      setNewReviewerAddress("");
      alert(`Authorized reviewer ${newReviewerAddress.trim()} on Program #${currentProgram.id}`);
    } catch (err: any) {
      alert(`Failed to add reviewer: ${err.message}`);
    } finally {
      setIsUpdatingReviewer(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProgram) return;

    try {
      setIsWithdrawing(true);
      const amountWei = ethers.parseEther(withdrawAmount);
      await onWithdrawFunds(currentProgram.id, amountWei);
      alert(`Successfully withdrawn ${withdrawAmount} tMSTC from Program #${currentProgram.id}`);
    } catch (err: any) {
      alert(`Withdrawal failed: ${err.message}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleClose = async () => {
    if (!currentProgram) return;
    if (confirm(`Are you sure you want to permanently close Program #${currentProgram.id}? No new submissions will be accepted.`)) {
      try {
        await onCloseProgram(currentProgram.id);
        alert(`Program #${currentProgram.id} closed.`);
      } catch (err: any) {
        alert(`Failed to close program: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-8 py-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory-300 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-graphite-950 font-sans">
            Project Owner Console
          </h1>
          <p className="text-xs text-graphite-500 mt-1">
            Escrow treasury accounting &bull; Authorized reviewer management on Coral Testnet
          </p>
        </div>

        {/* Program Selector */}
        {programs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-graphite-500">Managing:</span>
            <select
              value={currentProgram?.id || 1}
              onChange={(e) => setSelectedProgramId(Number(e.target.value))}
              className="bg-ivory-100 border border-ivory-300 rounded p-1.5 text-graphite-900 focus:outline-none"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  Prog #{p.id}: {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {currentProgram && (
        <div className="space-y-6">
          {/* Liquidity Accounting Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded bg-ivory-100 border border-ivory-300 space-y-1">
              <span className="text-2xs text-graphite-500 uppercase">Total Escrow Deposited</span>
              <div className="text-lg font-bold text-graphite-900">
                {currentProgram.totalFunded} {CORAL_CONFIG.nativeCurrency.symbol}
              </div>
              <span className="text-2xs text-graphite-400 block">Gross funded amount</span>
            </div>

            <div className="p-4 rounded bg-ivory-100 border border-ivory-300 space-y-1">
              <span className="text-2xs text-graphite-500 uppercase">Reserved for Claims</span>
              <div className="text-lg font-bold text-yellow-600">
                {currentProgram.reservedRewards} {CORAL_CONFIG.nativeCurrency.symbol}
              </div>
              <span className="text-2xs text-graphite-400 block">Locked for researchers</span>
            </div>

            <div className="p-4 rounded bg-ivory-100 border border-ivory-300 space-y-1">
              <span className="text-2xs text-graphite-500 uppercase">Settled Bounties</span>
              <div className="text-lg font-bold text-graphite-800">
                {currentProgram.paidRewards} {CORAL_CONFIG.nativeCurrency.symbol}
              </div>
              <span className="text-2xs text-graphite-400 block">Paid out to date</span>
            </div>

            <div className="p-4 rounded bg-ivory-100 border border-ivory-300 space-y-1">
              <span className="text-2xs text-graphite-500 uppercase">Available for Withdrawal</span>
              <div className="text-lg font-bold text-mint-600">
                {currentProgram.availableFunds} {CORAL_CONFIG.nativeCurrency.symbol}
              </div>
              <span className="text-2xs text-graphite-400 block">Unreserved liquidity</span>
            </div>
          </div>

          {/* Reviewer Management & Withdrawals Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Reviewers Box */}
            <div className="p-5 rounded bg-ivory-100 border border-ivory-300 space-y-4">
              <div className="flex items-center justify-between border-b border-ivory-200 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-coral-600" />
                  <h3 className="font-serif text-base font-bold text-graphite-900 font-sans">
                    Authorized Reviewers
                  </h3>
                </div>
                <span className="text-2xs text-graphite-500">On-Chain ACL</span>
              </div>

              <p className="text-2xs text-graphite-600 font-sans">
                Authorized reviewers can transition reports into <strong>Under Review</strong>,
                approve bounties, and reject invalid submissions. Program creator is authorized by default.
              </p>

              <div className="p-3 bg-ivory-50 rounded border border-ivory-300 space-y-1.5 text-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-graphite-500">Program Creator:</span>
                  <span className="font-bold text-graphite-900">{currentProgram.owner}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-graphite-500">Status:</span>
                  <span className="text-mint-600 font-bold">Authorized Reviewer</span>
                </div>
              </div>

              {/* Add reviewer form */}
              <form onSubmit={handleAddReviewer} className="space-y-3 pt-2">
                <label className="block text-graphite-600 uppercase text-2xs font-bold">
                  Add Reviewer EVM Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newReviewerAddress}
                    onChange={(e) => setNewReviewerAddress(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 bg-ivory-50 border border-ivory-300 rounded p-2 text-graphite-900 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingReviewer}
                    className="px-4 py-2 rounded bg-graphite-900 text-ivory-50 font-bold hover:bg-graphite-800 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-coral-400" />
                    <span>Authorize</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Treasury Withdrawal Box */}
            <div className="p-5 rounded bg-ivory-100 border border-ivory-300 space-y-4">
              <div className="flex items-center justify-between border-b border-ivory-200 pb-2">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-mint-600" />
                  <h3 className="font-serif text-base font-bold text-graphite-900 font-sans">
                    Withdraw Unreserved Liquidity
                  </h3>
                </div>
                <span className="text-2xs text-mint-700 bg-mint-100 px-2 py-0.5 rounded border border-mint-300">
                  Protected Invariant
                </span>
              </div>

              <p className="text-2xs text-graphite-600 font-sans">
                The smart contract prevents withdrawing funds reserved for approved submissions.
                You may only withdraw up to <strong>{currentProgram.availableFunds} tMSTC</strong>.
              </p>

              <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                <label className="block text-graphite-600 uppercase text-2xs font-bold">
                  Withdrawal Amount (tMSTC)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    max={currentProgram.availableFunds}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    className="flex-1 bg-ivory-50 border border-ivory-300 rounded p-2 text-graphite-900 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isWithdrawing || parseFloat(currentProgram.availableFunds) <= 0}
                    className="px-4 py-2 rounded bg-graphite-900 text-ivory-50 font-bold hover:bg-graphite-800 disabled:opacity-40 transition-colors flex items-center gap-1"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-mint-400" />
                    <span>Withdraw</span>
                  </button>
                </div>
              </form>

              {/* Close Program */}
              {currentProgram.active && (
                <div className="pt-4 border-t border-ivory-200 flex items-center justify-between">
                  <span className="text-2xs text-graphite-500">Deactivate disclosure scope:</span>
                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 text-2xs font-bold transition-colors flex items-center gap-1"
                  >
                    <PowerOff className="w-3 h-3" />
                    <span>Close Program</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

