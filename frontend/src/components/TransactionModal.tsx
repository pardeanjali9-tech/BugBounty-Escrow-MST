import React from "react";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, X, ShieldCheck } from "lucide-react";
import { TransactionRecord } from "../types";

interface TransactionModalProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const isPending = transaction.status === "pending";
  const isSuccess = transaction.status === "success";
  const isFailed = transaction.status === "failed" || transaction.status === "reverted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-ivory-50 border border-ivory-300 rounded-lg max-w-md w-full shadow-2xl overflow-hidden text-graphite-900">
        {/* Header */}
        <div className="bg-graphite-900 text-ivory-100 p-4 flex items-center justify-between border-b border-graphite-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-coral-400" />
            <h3 className="font-mono text-xs uppercase tracking-wider font-semibold">
              MST Coral Transaction
            </h3>
          </div>
          {!isPending && (
            <button
              onClick={onClose}
              className="text-graphite-400 hover:text-ivory-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            {isPending && (
              <div className="w-14 h-14 rounded-full bg-coral-100 border border-coral-300 flex items-center justify-center text-coral-500">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
            )}
            {isSuccess && (
              <div className="w-14 h-14 rounded-full bg-mint-100 border border-mint-300 flex items-center justify-center text-mint-500">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            )}
            {isFailed && (
              <div className="w-14 h-14 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-600">
                <AlertCircle className="w-7 h-7" />
              </div>
            )}
          </div>

          <div>
            <h4 className="font-serif text-lg font-bold text-graphite-950">
              {transaction.action}
            </h4>
            <p className="text-xs font-mono text-graphite-500 mt-1">
              {isPending && "Broadcasting to MST Coral Testnet via BridgeKey..."}
              {isSuccess && "Transaction confirmed on-chain on Coral Testnet."}
              {isFailed && (transaction.details || "Transaction failed or reverted.")}
            </p>
          </div>

          {/* Transaction Metadata Box */}
          {transaction.hash !== "failed" && (
            <div className="bg-ivory-100 border border-ivory-300 rounded p-3 text-left font-mono text-2xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-graphite-500">Status:</span>
                <span
                  className={`font-semibold uppercase tracking-wider ${
                    isPending
                      ? "text-coral-500"
                      : isSuccess
                      ? "text-mint-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.status}
                </span>
              </div>

              {transaction.blockNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-graphite-500">Block:</span>
                  <span className="font-semibold text-graphite-800">
                    #{transaction.blockNumber}
                  </span>
                </div>
              )}

              {transaction.gasUsed && (
                <div className="flex justify-between items-center">
                  <span className="text-graphite-500">Gas Used:</span>
                  <span className="font-semibold text-graphite-800">
                    {transaction.gasUsed}
                  </span>
                </div>
              )}

              <div className="pt-1 border-t border-ivory-200">
                <span className="text-graphite-500 block mb-1">Transaction Hash:</span>
                <span className="text-2xs text-graphite-800 break-all select-all font-mono">
                  {transaction.hash}
                </span>
              </div>
            </div>
          )}

          {/* Explorer Link */}
          {transaction.hash !== "failed" && (
            <a
              href={transaction.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-coral-600 hover:text-coral-700 underline"
            >
              <span>View in Coral Block Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="bg-ivory-200 border-t border-ivory-300 p-3.5 flex justify-end">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-1.5 rounded bg-graphite-900 text-ivory-50 text-xs font-mono font-semibold hover:bg-graphite-800 disabled:opacity-40 transition-colors"
          >
            {isPending ? "Awaiting Confirmation..." : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

