import React from "react";
import { X, ShieldCheck, ExternalLink, Copy, Check, Lock, Clock, FileText } from "lucide-react";
import { Report, ReportStatus, Severity } from "../types";
import { CORAL_CONFIG } from "../config/coralConfig";

interface ReportDetailModalProps {
  report: Report | null;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!report) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-ivory-50 border border-ivory-300 rounded-lg max-w-xl w-full shadow-2xl overflow-hidden text-graphite-900 font-mono text-xs">
        {/* Header */}
        <div className="bg-graphite-900 text-ivory-100 p-4 flex items-center justify-between border-b border-graphite-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-coral-400" />
            <h3 className="font-serif text-base font-bold font-sans">
              On-Chain Report Audit Ledger &bull; #{report.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-graphite-400 hover:text-ivory-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-ivory-300">
            <div>
              <span className="text-2xs uppercase text-graphite-500 block">Report ID:</span>
              <span className="text-base font-bold text-graphite-950">#{report.id}</span>
            </div>
            <div>
              <span className="text-2xs uppercase text-graphite-500 block">Target Program:</span>
              <span className="text-base font-bold text-graphite-950">Program #{report.programId}</span>
            </div>
            <div>
              <span className="text-2xs uppercase text-graphite-500 block">Status:</span>
              <span className="font-bold text-graphite-900">{ReportStatus[report.status]}</span>
            </div>
            <div>
              <span className="text-2xs uppercase text-graphite-500 block">Severity:</span>
              <span className="font-bold text-coral-600">{Severity[report.severity]}</span>
            </div>
          </div>

          <div>
            <span className="text-2xs uppercase text-graphite-500 block mb-1">Submitting Researcher:</span>
            <span className="text-2xs text-graphite-800 select-all font-mono">{report.researcher}</span>
          </div>

          {/* Cryptographic Commitment Box */}
          <div className="p-3.5 rounded bg-ivory-100 border border-ivory-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase text-graphite-600 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-coral-600" />
                <span>On-Chain Cryptographic Commitment (bytes32)</span>
              </span>
              <button
                onClick={() => copyToClipboard(report.commitment)}
                className="text-2xs text-coral-600 hover:text-coral-700 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <code className="text-2xs text-graphite-800 break-all select-all block bg-ivory-50 p-2 rounded border border-ivory-200">
              {report.commitment}
            </code>
          </div>

          {/* Storage Reference */}
          <div>
            <span className="text-2xs uppercase text-graphite-500 block mb-1">
              Encrypted Storage Reference:
            </span>
            <code className="text-2xs text-graphite-800 break-all select-all block bg-ivory-100 p-2 rounded border border-ivory-300">
              {report.encryptedReportRef}
            </code>
          </div>

          {/* Rejection / Appeal Information */}
          {report.rejectionReason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 space-y-1">
              <span className="text-2xs uppercase font-bold block">Rejection Reason:</span>
              <p className="text-xs font-sans">{report.rejectionReason}</p>
            </div>
          )}

          {report.appealRef && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded text-purple-800 space-y-1">
              <span className="text-2xs uppercase font-bold block">Appeal Notes / Reference:</span>
              <p className="text-xs font-sans">{report.appealRef}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-2 border-t border-ivory-200 text-2xs text-graphite-500 space-y-1">
            <div className="flex justify-between">
              <span>Submitted On:</span>
              <span>{new Date(report.submittedAt).toUTCString()}</span>
            </div>
            {report.reviewedAt > 0 && (
              <div className="flex justify-between">
                <span>Last Reviewed On:</span>
                <span>{new Date(report.reviewedAt).toUTCString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-ivory-200 border-t border-ivory-300 p-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-graphite-900 text-ivory-50 text-xs font-mono font-semibold hover:bg-graphite-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

