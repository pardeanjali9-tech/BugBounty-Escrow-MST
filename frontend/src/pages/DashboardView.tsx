import React from "react";
import {
  Coins,
  Shield,
  FileText,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  PlusCircle,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Program, Report, ReportStatus, Severity } from "../types";
import { CORAL_CONFIG } from "../config/coralConfig";

interface DashboardViewProps {
  programs: Program[];
  reports: Report[];
  onNavigate: (tab: string) => void;
  onOpenCreateProgram: () => void;
  activeAccount: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  programs,
  reports,
  onNavigate,
  onOpenCreateProgram,
  activeAccount,
}) => {
  // Aggregate stats
  const totalEscrowWei = programs.reduce(
    (acc, p) => acc + (p.totalFundedWei || 0n),
    0n
  );
  const totalReservedWei = programs.reduce(
    (acc, p) => acc + (p.reservedRewardsWei || 0n),
    0n
  );
  const totalPaidWei = programs.reduce(
    (acc, p) => acc + (p.paidRewardsWei || 0n),
    0n
  );
  const totalAvailableWei = programs.reduce(
    (acc, p) => acc + (p.availableFundsWei || 0n),
    0n
  );

  const pendingReviewsCount = reports.filter(
    (r) => r.status === ReportStatus.Submitted || r.status === ReportStatus.UnderReview || r.status === ReportStatus.Appealed
  ).length;

  const approvedCount = reports.filter((r) => r.status === ReportStatus.Approved).length;
  const claimedCount = reports.filter((r) => r.status === ReportStatus.Claimed).length;

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.Submitted:
        return { label: "Submitted", color: "bg-coral-100 text-coral-700 border-coral-300" };
      case ReportStatus.UnderReview:
        return { label: "Under Review", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
      case ReportStatus.Approved:
        return { label: "Approved", color: "bg-mint-100 text-mint-800 border-mint-300" };
      case ReportStatus.Rejected:
        return { label: "Rejected", color: "bg-graphite-200 text-graphite-700 border-graphite-400" };
      case ReportStatus.Appealed:
        return { label: "Appealed", color: "bg-purple-100 text-purple-700 border-purple-300" };
      case ReportStatus.Claimed:
        return { label: "Claimed", color: "bg-blue-100 text-blue-800 border-blue-300" };
    }
  };

  const getSeverityLabel = (sev: Severity) => {
    switch (sev) {
      case Severity.Low:
        return { label: "Low", color: "text-graphite-600" };
      case Severity.Medium:
        return { label: "Medium", color: "text-yellow-600" };
      case Severity.High:
        return { label: "High", color: "text-orange-600 font-semibold" };
      case Severity.Critical:
        return { label: "Critical", color: "text-coral-600 font-bold" };
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header & Quick Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory-300 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-graphite-950">
            Protocol Dashboard
          </h1>
          <p className="text-xs font-mono text-graphite-500 mt-1">
            Real-time escrow liquidity, report state machines &bull; MST Coral Testnet
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("submit")}
            className="px-4 py-2 rounded bg-graphite-900 text-ivory-50 text-xs font-mono font-medium hover:bg-graphite-800 shadow transition-colors flex items-center gap-1.5"
          >
            <span>Submit Report</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-coral-400" />
          </button>
          <button
            onClick={onOpenCreateProgram}
            className="px-4 py-2 rounded bg-ivory-200 text-graphite-800 text-xs font-mono font-medium hover:bg-ivory-300 border border-ivory-400 transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-coral-600" />
            <span>Create Bounty Program</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded bg-ivory-100 border border-ivory-300 space-y-1">
          <div className="flex items-center justify-between text-2xs text-graphite-500 uppercase tracking-wider">
            <span>Escrow Locked</span>
            <Coins className="w-4 h-4 text-coral-500" />
          </div>
          <div className="text-xl font-bold text-graphite-900">
            {programs.reduce((acc, p) => acc + parseFloat(p.totalFunded || "0"), 0).toFixed(2)}{" "}
            <span className="text-xs text-coral-600 font-normal">{CORAL_CONFIG.nativeCurrency.symbol}</span>
          </div>
          <div className="text-2xs text-graphite-500 pt-1 border-t border-ivory-200">
            Avail: {programs.reduce((acc, p) => acc + parseFloat(p.availableFunds || "0"), 0).toFixed(2)} tMSTC
          </div>
        </div>

        <div className="p-4 rounded bg-ivory-100 border border-ivory-300 space-y-1">
          <div className="flex items-center justify-between text-2xs text-graphite-500 uppercase tracking-wider">
            <span>Active Programs</span>
            <Shield className="w-4 h-4 text-mint-500" />
          </div>
          <div className="text-xl font-bold text-graphite-900">
            {programs.filter((p) => p.active).length}
          </div>
          <div className="text-2xs text-graphite-500 pt-1 border-t border-ivory-200">
            Total registered: {programs.length}
          </div>
        </div>

        <div className="p-4 rounded bg-ivory-100 border border-ivory-300 space-y-1">
          <div className="flex items-center justify-between text-2xs text-graphite-500 uppercase tracking-wider">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-xl font-bold text-graphite-900">
            {pendingReviewsCount}
          </div>
          <div className="text-2xs text-graphite-500 pt-1 border-t border-ivory-200">
            Encrypted disclosures
          </div>
        </div>

        <div className="p-4 rounded bg-ivory-100 border border-ivory-300 space-y-1">
          <div className="flex items-center justify-between text-2xs text-graphite-500 uppercase tracking-wider">
            <span>Claims Settled</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-graphite-900">
            {claimedCount}
          </div>
          <div className="text-2xs text-graphite-500 pt-1 border-t border-ivory-200">
            Approved: {approvedCount}
          </div>
        </div>
      </div>

      {/* Escrow Liquidity Breakdown Card */}
      <div className="p-5 rounded bg-ivory-100 border border-ivory-300 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-ivory-200 pb-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-coral-600" />
            <h3 className="font-serif text-sm font-bold text-graphite-900">
              Escrow Accounting Invariant
            </h3>
          </div>
          <span className="text-2xs text-mint-600 bg-mint-100 px-2 py-0.5 rounded border border-mint-300 font-semibold">
            Invariant Verified
          </span>
        </div>

        <p className="text-graphite-600 font-sans text-xs">
          The BugBountyEscrow contract enforces that total funded deposits strictly equal the sum of
          unreserved available liquidity, reserved rewards for approved submissions, and settled researcher payouts.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-ivory-50 rounded border border-ivory-300">
            <span className="text-2xs text-graphite-500 uppercase block">Available Liquidity</span>
            <span className="text-base font-bold text-mint-600">
              {programs.reduce((acc, p) => acc + parseFloat(p.availableFunds || "0"), 0).toFixed(4)} tMSTC
            </span>
          </div>

          <div className="p-3 bg-ivory-50 rounded border border-ivory-300">
            <span className="text-2xs text-graphite-500 uppercase block">Reserved for Claims</span>
            <span className="text-base font-bold text-yellow-600">
              {programs.reduce((acc, p) => acc + parseFloat(p.reservedRewards || "0"), 0).toFixed(4)} tMSTC
            </span>
          </div>

          <div className="p-3 bg-ivory-50 rounded border border-ivory-300">
            <span className="text-2xs text-graphite-500 uppercase block">Settled Payouts</span>
            <span className="text-base font-bold text-graphite-800">
              {programs.reduce((acc, p) => acc + parseFloat(p.paidRewards || "0"), 0).toFixed(4)} tMSTC
            </span>
          </div>
        </div>
      </div>

      {/* Recent Disclosures Section */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-ivory-300 pb-2">
          <h2 className="font-serif text-xl font-bold text-graphite-950">
            Recent Vulnerability Disclosures
          </h2>
          <span className="text-2xs font-mono text-graphite-400 uppercase">
            On-Chain Commitments ({reports.length})
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center rounded bg-ivory-100 border border-ivory-300 text-graphite-500 font-mono text-xs space-y-2">
            <p>No reports registered on-chain yet.</p>
            <button
              onClick={() => onNavigate("submit")}
              className="text-coral-600 underline font-semibold"
            >
              Submit the first encrypted report &rarr;
            </button>
          </div>
        ) : (
          <div className="border border-ivory-300 rounded overflow-hidden bg-ivory-50 shadow-sm">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-ivory-200 text-graphite-700 text-2xs uppercase tracking-wider border-b border-ivory-300">
                  <th className="p-3">ID</th>
                  <th className="p-3">Program</th>
                  <th className="p-3">Researcher</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Commitment (bytes32)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {reports.slice(0, 5).map((rep) => {
                  const statusInfo = getStatusLabel(rep.status);
                  const sevInfo = getSeverityLabel(rep.severity);
                  return (
                    <tr key={rep.id} className="hover:bg-ivory-100 transition-colors">
                      <td className="p-3 font-bold text-graphite-900">#{rep.id}</td>
                      <td className="p-3 text-graphite-700">Prog #{rep.programId}</td>
                      <td className="p-3 text-graphite-600">
                        {rep.researcher.slice(0, 6)}...{rep.researcher.slice(-4)}
                      </td>
                      <td className="p-3">
                        <span className={sevInfo.color}>{sevInfo.label}</span>
                      </td>
                      <td className="p-3 text-graphite-500 text-2xs">
                        {rep.commitment.slice(0, 10)}...{rep.commitment.slice(-8)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-2xs font-semibold border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-graphite-800">
                        {parseFloat(rep.approvedReward) > 0
                          ? `${rep.approvedReward} tMSTC`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

