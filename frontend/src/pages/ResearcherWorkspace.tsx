import React, { useState } from "react";
import {
  FileText,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ExternalLink,
  RotateCcw,
  X,
  Eye,
} from "lucide-react";
import { Report, ReportStatus, Severity } from "../types";
import { CORAL_CONFIG } from "../config/coralConfig";

interface ResearcherWorkspaceProps {
  reports: Report[];
  activeAccount: string | null;
  onClaimReward: (reportId: number) => Promise<any>;
  onAppealReport: (reportId: number, appealRef: string) => Promise<any>;
  onViewReportDetail: (report: Report) => void;
  onNavigate: (tab: string) => void;
}

export const ResearcherWorkspace: React.FC<ResearcherWorkspaceProps> = ({
  reports,
  activeAccount,
  onClaimReward,
  onAppealReport,
  onViewReportDetail,
  onNavigate,
}) => {
  const [appealModalReportId, setAppealModalReportId] = useState<number | null>(null);
  const [appealNotes, setAppealNotes] = useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  // Filter reports submitted by researcher
  const myReports = activeAccount
    ? reports.filter(
        (r) => r.researcher.toLowerCase() === activeAccount.toLowerCase()
      )
    : [];

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealModalReportId || !appealNotes.trim()) return;

    try {
      setIsSubmittingAppeal(true);
      const appealRef = `appeal-${Date.now()}-${appealNotes.trim().slice(0, 32)}`;
      await onAppealReport(appealModalReportId, appealRef);
      setAppealModalReportId(null);
      setAppealNotes("");
    } catch (err: any) {
      alert(`Appeal failed: ${err.message}`);
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.Submitted:
        return (
          <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-coral-100 text-coral-700 border border-coral-300">
            Submitted
          </span>
        );
      case ReportStatus.UnderReview:
        return (
          <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
            Under Review
          </span>
        );
      case ReportStatus.Approved:
        return (
          <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-mint-100 text-mint-800 border border-mint-300">
            Approved
          </span>
        );
      case ReportStatus.Rejected:
        return (
          <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-graphite-200 text-graphite-700 border border-graphite-300">
            Rejected
          </span>
        );
      case ReportStatus.Appealed:
        return (
          <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-purple-100 text-purple-700 border border-purple-300">
            Appealed
          </span>
        );
      case ReportStatus.Claimed:
        return (
          <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            Claimed
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case Severity.Low:
        return <span className="text-graphite-500">Low</span>;
      case Severity.Medium:
        return <span className="text-yellow-600 font-medium">Medium</span>;
      case Severity.High:
        return <span className="text-orange-600 font-semibold">High</span>;
      case Severity.Critical:
        return <span className="text-coral-600 font-bold">Critical</span>;
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory-300 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-graphite-950">
            Researcher Workspace
          </h1>
          <p className="text-xs font-mono text-graphite-500 mt-1">
            Track submitted encrypted findings, appeal rejections, and claim approved escrow rewards
          </p>
        </div>

        <button
          onClick={() => onNavigate("submit")}
          className="px-4 py-2 rounded bg-graphite-900 text-ivory-50 text-xs font-mono font-medium hover:bg-graphite-800 shadow transition-colors flex items-center gap-1.5"
        >
          <span>Submit New Finding</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-coral-400" />
        </button>
      </div>

      {!activeAccount ? (
        <div className="p-8 text-center rounded bg-ivory-100 border border-ivory-300 text-graphite-600 font-mono text-xs space-y-2">
          <p>Please connect your BridgeKey Wallet to view your submitted reports and claim rewards.</p>
        </div>
      ) : myReports.length === 0 ? (
        <div className="p-8 text-center rounded bg-ivory-100 border border-ivory-300 text-graphite-600 font-mono text-xs space-y-3">
          <p>No vulnerability reports submitted from connected address {activeAccount}.</p>
          <button
            onClick={() => onNavigate("submit")}
            className="px-4 py-2 rounded bg-graphite-900 text-ivory-50 font-bold hover:bg-graphite-800 transition-colors inline-block"
          >
            Submit an Encrypted Report
          </button>
        </div>
      ) : (
        <div className="border border-ivory-300 rounded overflow-hidden bg-ivory-50 shadow-sm">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-ivory-200 text-graphite-700 text-2xs uppercase tracking-wider border-b border-ivory-300">
                <th className="p-3">ID</th>
                <th className="p-3">Program</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Commitment (bytes32)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Reward</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {myReports.map((report) => (
                <tr key={report.id} className="hover:bg-ivory-100 transition-colors">
                  <td className="p-3 font-bold text-graphite-900">#{report.id}</td>
                  <td className="p-3 text-graphite-700">Prog #{report.programId}</td>
                  <td className="p-3">{getSeverityBadge(report.severity)}</td>
                  <td className="p-3 text-graphite-500 text-2xs select-all">
                    {report.commitment.slice(0, 10)}...{report.commitment.slice(-8)}
                  </td>
                  <td className="p-3">{getStatusBadge(report.status)}</td>
                  <td className="p-3 font-bold text-graphite-900">
                    {parseFloat(report.approvedReward) > 0
                      ? `${report.approvedReward} tMSTC`
                      : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewReportDetail(report)}
                        className="p-1 text-graphite-500 hover:text-graphite-900 transition-colors"
                        title="View Audit Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Claim Button for Approved Reports */}
                      {report.status === ReportStatus.Approved && (
                        <button
                          onClick={() => onClaimReward(report.id)}
                          className="px-3 py-1 rounded bg-mint-500 hover:bg-mint-600 text-ivory-50 font-bold text-2xs transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Coins className="w-3 h-3" />
                          <span>Claim Bounty</span>
                        </button>
                      )}

                      {/* Appeal Button for Rejected Reports */}
                      {report.status === ReportStatus.Rejected && (
                        <button
                          onClick={() => setAppealModalReportId(report.id)}
                          className="px-2.5 py-1 rounded bg-ivory-200 hover:bg-ivory-300 text-graphite-800 border border-ivory-400 text-2xs font-medium transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3 text-coral-600" />
                          <span>Appeal</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Appeal Submission Modal */}
      {appealModalReportId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-ivory-50 border border-ivory-300 rounded-lg max-w-md w-full shadow-2xl overflow-hidden text-graphite-900">
            <div className="bg-graphite-900 text-ivory-100 p-4 flex items-center justify-between border-b border-graphite-800">
              <h3 className="font-serif text-base font-bold">
                Appeal Rejection &bull; Report #{appealModalReportId}
              </h3>
              <button
                onClick={() => setAppealModalReportId(null)}
                className="text-graphite-400 hover:text-ivory-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAppealSubmit} className="p-5 space-y-4 text-xs font-mono">
              <p className="text-graphite-600 font-sans text-xs">
                Provide clarifying technical evidence or dispute the rejection reason. The report will
                transition to <strong>Appealed</strong> and return to the reviewers queue.
              </p>

              <div>
                <label className="block text-graphite-600 uppercase text-2xs mb-1 font-bold">
                  Appeal Arguments / Evidence
                </label>
                <textarea
                  value={appealNotes}
                  onChange={(e) => setAppealNotes(e.target.value)}
                  placeholder="Detail why the vulnerability is in scope or refute the rejection reasoning..."
                  rows={4}
                  required
                  className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700 font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
                <button
                  type="button"
                  onClick={() => setAppealModalReportId(null)}
                  className="px-3 py-1.5 rounded text-graphite-600 hover:text-graphite-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAppeal}
                  className="px-4 py-1.5 rounded bg-graphite-900 text-ivory-50 font-bold hover:bg-graphite-800 disabled:opacity-50"
                >
                  {isSubmittingAppeal ? "Submitting..." : "Submit Appeal to Coral"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

