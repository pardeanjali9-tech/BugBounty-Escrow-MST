import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  X,
  FileCheck2,
} from "lucide-react";
import { Report, ReportStatus, Severity, VulnerabilityPlaintext, Program } from "../types";
import { VeilApiService } from "../services/api";
import { VeilEncryptionService } from "../services/encryption";
import { ethers } from "ethers";

interface ReviewerWorkspaceProps {
  programs: Program[];
  reports: Report[];
  activeAccount: string | null;
  onStartReview: (reportId: number) => Promise<any>;
  onApproveReport: (reportId: number, rewardAmountWei: bigint) => Promise<any>;
  onRejectReport: (reportId: number, reason: string) => Promise<any>;
}

export const ReviewerWorkspace: React.FC<ReviewerWorkspaceProps> = ({
  programs,
  reports,
  activeAccount,
  onStartReview,
  onApproveReport,
  onRejectReport,
}) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [decryptedData, setDecryptedData] = useState<VulnerabilityPlaintext | null>(null);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);

  // Approve modal state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<string>("0.5");
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  // Reject modal state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Active filter
  const [filterProgramId, setFilterProgramId] = useState<number | "all">("all");

  const filteredReports = reports.filter((r) =>
    filterProgramId === "all" ? true : r.programId === filterProgramId
  );

  const handleDecrypt = async (report: Report) => {
    setSelectedReport(report);
    setDecryptedData(null);
    setDecryptionError(null);
    setIsDecrypting(true);

    try {
      // 1. Fetch ciphertext from backend storage
      const storageId = report.encryptedReportRef.replace("veil://", "");
      const res = await VeilApiService.getEncryptedReport(storageId);

      if (!res.success || !res.data) {
        throw new Error("Failed to retrieve encrypted ciphertext from backend storage.");
      }

      // 2. Decrypt locally and verify commitment
      const result = await VeilEncryptionService.decryptAndVerifyReport(
        res.data.ciphertext,
        res.data.iv,
        res.data.wrappedKey,
        report.commitment
      );

      setDecryptedData(result.report);
    } catch (err: any) {
      setDecryptionError(err.message || "Decryption or integrity verification failed.");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setIsSubmittingApprove(true);
      const rewardWei = ethers.parseEther(rewardAmount);
      await onApproveReport(selectedReport.id, rewardWei);
      setIsApproveOpen(false);
      setSelectedReport(null);
      setDecryptedData(null);
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !rejectionReason.trim()) return;

    try {
      setIsSubmittingReject(true);
      await onRejectReport(selectedReport.id, rejectionReason.trim());
      setIsRejectOpen(false);
      setSelectedReport(null);
      setDecryptedData(null);
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory-300 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-graphite-950">
            Reviewer Workspace
          </h1>
          <p className="text-xs font-mono text-graphite-500 mt-1">
            Authorized decryption workstation &bull; Cryptographic commitment integrity checks
          </p>
        </div>

        {/* Program Filter */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-graphite-500">Filter Scope:</span>
          <select
            value={filterProgramId}
            onChange={(e) =>
              setFilterProgramId(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
            className="bg-ivory-100 border border-ivory-300 rounded p-1.5 text-graphite-900 focus:outline-none"
          >
            <option value="all">All Programs ({reports.length})</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                Program #{p.id}: {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="border border-ivory-300 rounded overflow-hidden bg-ivory-50 shadow-sm font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ivory-200 text-graphite-700 text-2xs uppercase tracking-wider border-b border-ivory-300">
              <th className="p-3">ID</th>
              <th className="p-3">Program</th>
              <th className="p-3">Researcher</th>
              <th className="p-3">Commitment (bytes32)</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ivory-200">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-graphite-500">
                  No vulnerability submissions under the selected filter.
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-ivory-100 transition-colors">
                  <td className="p-3 font-bold text-graphite-900">#{report.id}</td>
                  <td className="p-3 text-graphite-700">Prog #{report.programId}</td>
                  <td className="p-3 text-graphite-600">
                    {report.researcher.slice(0, 6)}...{report.researcher.slice(-4)}
                  </td>
                  <td className="p-3 text-graphite-500 text-2xs select-all">
                    {report.commitment.slice(0, 10)}...{report.commitment.slice(-8)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-ivory-200 border border-ivory-300 text-graphite-800">
                      {ReportStatus[report.status]}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDecrypt(report)}
                      className="px-3 py-1.5 rounded bg-graphite-900 text-ivory-50 hover:bg-graphite-800 font-medium text-2xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <Unlock className="w-3 h-3 text-coral-400" />
                      <span>Inspect & Decrypt</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Decryption & Inspection Drawer / Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-ivory-50 border border-ivory-300 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-graphite-900">
            {/* Header */}
            <div className="bg-graphite-900 text-ivory-100 p-4 sticky top-0 flex items-center justify-between border-b border-graphite-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-coral-400" />
                <h3 className="font-serif text-base font-bold">
                  Decrypted Audit View &bull; Report #{selectedReport.id}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setDecryptedData(null);
                }}
                className="text-graphite-400 hover:text-ivory-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-xs font-mono">
              {isDecrypting && (
                <div className="p-8 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-coral-500 mx-auto" />
                  <p className="text-graphite-600">
                    Retrieving ciphertext and verifying cryptographic commitment in browser...
                  </p>
                </div>
              )}

              {decryptionError && (
                <div className="p-4 rounded bg-red-100 border border-red-300 text-red-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-2xs uppercase">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Integrity / Decryption Failure</span>
                  </div>
                  <p className="text-xs font-sans">{decryptionError}</p>
                </div>
              )}

              {decryptedData && (
                <div className="space-y-4">
                  {/* Verified Integrity Badge */}
                  <div className="p-3 rounded bg-mint-50 border border-mint-300 text-mint-800 flex items-center justify-between text-2xs">
                    <div className="flex items-center gap-2 font-bold">
                      <FileCheck2 className="w-4 h-4 text-mint-600" />
                      <span>Cryptographic Commitment Integrity Verified</span>
                    </div>
                    <span className="font-mono text-mint-700">SHA-256 / Keccak Match</span>
                  </div>

                  {/* Title & Metadata */}
                  <div className="space-y-1 border-b border-ivory-300 pb-3">
                    <span className="text-2xs uppercase text-graphite-500">Title</span>
                    <h2 className="font-serif text-xl font-bold text-graphite-950 font-sans">
                      {decryptedData.title}
                    </h2>
                    <div className="flex gap-4 text-2xs text-graphite-600 pt-1">
                      <span>Component: {decryptedData.affectedComponent}</span>
                      <span>Severity: {Severity[decryptedData.severity]}</span>
                      <span>Researcher: {decryptedData.researcherAddress}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <span className="text-2xs uppercase text-graphite-500 font-bold block">
                      Vulnerability Details
                    </span>
                    <div className="p-3 bg-ivory-100 rounded border border-ivory-300 font-sans text-graphite-800 whitespace-pre-wrap leading-relaxed">
                      {decryptedData.description}
                    </div>
                  </div>

                  {/* Impact */}
                  {decryptedData.impact && (
                    <div className="space-y-1">
                      <span className="text-2xs uppercase text-graphite-500 font-bold block">
                        Impact Assessment
                      </span>
                      <div className="p-3 bg-ivory-100 rounded border border-ivory-300 font-sans text-graphite-800 whitespace-pre-wrap leading-relaxed">
                        {decryptedData.impact}
                      </div>
                    </div>
                  )}

                  {/* Proof of Concept */}
                  {decryptedData.proofOfConcept && (
                    <div className="space-y-1">
                      <span className="text-2xs uppercase text-graphite-500 font-bold block">
                        Proof of Concept / Exploit Steps
                      </span>
                      <pre className="p-3 bg-graphite-900 text-ivory-100 rounded text-2xs font-mono whitespace-pre-wrap overflow-x-auto">
                        {decryptedData.proofOfConcept}
                      </pre>
                    </div>
                  )}

                  {/* Remediation */}
                  {decryptedData.remediationRecommendation && (
                    <div className="space-y-1">
                      <span className="text-2xs uppercase text-graphite-500 font-bold block">
                        Remediation Recommendation
                      </span>
                      <div className="p-3 bg-ivory-100 rounded border border-ivory-300 font-sans text-graphite-800">
                        {decryptedData.remediationRecommendation}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with State Transition Controls */}
            {decryptedData && (
              <div className="bg-ivory-200 border-t border-ivory-300 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xs text-graphite-500 font-mono">
                    Current Status: <strong>{ReportStatus[selectedReport.status]}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Start Review if in Submitted or Appealed state */}
                  {(selectedReport.status === ReportStatus.Submitted ||
                    selectedReport.status === ReportStatus.Appealed) && (
                    <button
                      onClick={() => onStartReview(selectedReport.id)}
                      className="px-3 py-1.5 rounded bg-yellow-600 text-ivory-50 text-xs font-mono font-medium hover:bg-yellow-700 transition-colors"
                    >
                      Start Official Review
                    </button>
                  )}

                  {/* Approve button (if UnderReview) */}
                  {selectedReport.status === ReportStatus.UnderReview && (
                    <>
                      <button
                        onClick={() => setIsRejectOpen(true)}
                        className="px-3 py-1.5 rounded bg-graphite-200 hover:bg-graphite-300 text-red-700 border border-graphite-400 text-xs font-mono font-medium transition-colors"
                      >
                        Reject Finding
                      </button>

                      <button
                        onClick={() => setIsApproveOpen(true)}
                        className="px-4 py-1.5 rounded bg-mint-500 hover:bg-mint-600 text-ivory-50 text-xs font-mono font-bold transition-colors"
                      >
                        Approve & Reserve Bounty
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {isApproveOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-ivory-50 border border-ivory-300 rounded-lg max-w-sm w-full shadow-2xl p-5 space-y-4 text-xs font-mono text-graphite-900">
            <h3 className="font-serif text-base font-bold">
              Approve Report #{selectedReport.id}
            </h3>
            <p className="text-graphite-600 font-sans">
              Enter bounty amount in tMSTC to reserve from program escrow for the researcher.
            </p>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-graphite-600 uppercase text-2xs mb-1 font-bold">
                  Bounty Reward (tMSTC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  required
                  className="w-full bg-ivory-100 border border-ivory-300 rounded p-2 text-graphite-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
                <button
                  type="button"
                  onClick={() => setIsApproveOpen(false)}
                  className="px-3 py-1.5 rounded text-graphite-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApprove}
                  className="px-4 py-1.5 rounded bg-mint-500 hover:bg-mint-600 text-ivory-50 font-bold disabled:opacity-50"
                >
                  {isSubmittingApprove ? "Locking..." : "Confirm & Lock on Coral"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-ivory-50 border border-ivory-300 rounded-lg max-w-sm w-full shadow-2xl p-5 space-y-4 text-xs font-mono text-graphite-900">
            <h3 className="font-serif text-base font-bold">
              Reject Report #{selectedReport.id}
            </h3>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-graphite-600 uppercase text-2xs mb-1 font-bold">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Known issue, out of scope, or non-reproducible..."
                  rows={3}
                  required
                  className="w-full bg-ivory-100 border border-ivory-300 rounded p-2 text-graphite-900 focus:outline-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="px-3 py-1.5 rounded text-graphite-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject}
                  className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-ivory-50 font-bold disabled:opacity-50"
                >
                  {isSubmittingReject ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

