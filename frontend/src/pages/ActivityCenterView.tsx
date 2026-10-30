import React from "react";
import { ExternalLink, CheckCircle2, Clock, AlertCircle, Shield, Activity } from "lucide-react";
import { TransactionRecord } from "../types";
import { CORAL_CONFIG } from "../config/coralConfig";

interface ActivityCenterViewProps {
  txHistory: TransactionRecord[];
}

export const ActivityCenterView: React.FC<ActivityCenterViewProps> = ({
  txHistory,
}) => {
  return (
    <div className="space-y-8 py-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory-300 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-graphite-950 font-sans">
            Coral Activity Ledger
          </h1>
          <p className="text-xs text-graphite-500 mt-1">
            Verifiable transaction receipts &bull; MST Coral Testnet (Chain ID 54635)
          </p>
        </div>

        <a
          href={CORAL_CONFIG.blockExplorer}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded bg-ivory-200 border border-ivory-400 text-graphite-800 hover:bg-ivory-300 transition-colors flex items-center gap-1.5 font-medium"
        >
          <span>Open Coral Explorer</span>
          <ExternalLink className="w-3.5 h-3.5 text-coral-600" />
        </a>
      </div>

      {/* Transaction History Table */}
      {txHistory.length === 0 ? (
        <div className="p-8 text-center rounded bg-ivory-100 border border-ivory-300 text-graphite-500 space-y-2">
          <Activity className="w-8 h-8 mx-auto text-graphite-400" />
          <p>No transactions initiated in current session.</p>
          <p className="text-2xs text-graphite-400">
            Smart contract interactions via BridgeKey will be logged here with explorer receipts.
          </p>
        </div>
      ) : (
        <div className="border border-ivory-300 rounded overflow-hidden bg-ivory-50 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ivory-200 text-graphite-700 text-2xs uppercase tracking-wider border-b border-ivory-300">
                <th className="p-3">Action</th>
                <th className="p-3">Status</th>
                <th className="p-3">Transaction Hash</th>
                <th className="p-3">Block</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {txHistory.map((tx, idx) => (
                <tr key={`${tx.hash}-${idx}`} className="hover:bg-ivory-100 transition-colors">
                  <td className="p-3 font-semibold text-graphite-900">{tx.action}</td>
                  <td className="p-3">
                    {tx.status === "pending" && (
                      <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 inline-flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 animate-spin" />
                        Pending
                      </span>
                    )}
                    {tx.status === "success" && (
                      <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-mint-100 text-mint-800 border border-mint-300 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-mint-600" />
                        Success
                      </span>
                    )}
                    {(tx.status === "failed" || tx.status === "reverted") && (
                      <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5 text-red-600" />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-graphite-600 text-2xs font-mono">
                    {tx.hash !== "failed"
                      ? `${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
                      : "Execution Reverted"}
                  </td>
                  <td className="p-3 text-graphite-700">
                    {tx.blockNumber ? `#${tx.blockNumber}` : "—"}
                  </td>
                  <td className="p-3 text-graphite-500 text-2xs">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3 text-right">
                    {tx.hash !== "failed" && (
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-coral-600 hover:text-coral-700 inline-flex items-center gap-1 font-semibold text-2xs"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

