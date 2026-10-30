import React, { useState } from "react";
import {
  Lock,
  Shield,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ExternalLink,
  KeyRound,
  FileText,
} from "lucide-react";
import { Program, Severity, VulnerabilityPlaintext } from "../types";
import { VeilEncryptionService, EncryptionResult } from "../services/encryption";
import { VeilApiService } from "../services/api";
import { CORAL_CONFIG } from "../config/coralConfig";

interface SubmitReportViewProps {
  programs: Program[];
  selectedProgramId?: number;
  onSubmitOnChain: (
    programId: number,
    commitment: string,
    encryptedReportRef: string,
    severity: number
  ) => Promise<any>;
  activeAccount: string | null;
  onNavigate: (tab: string) => void;
}

export const SubmitReportView: React.FC<SubmitReportViewProps> = ({
  programs,
  selectedProgramId,
  onSubmitOnChain,
  activeAccount,
  onNavigate,
}) => {
  const [step, setStep] = useState<number>(1);
  const [programId, setProgramId] = useState<number>(
    selectedProgramId || (programs.length > 0 ? programs[0].id : 1)
  );

  // Form fields
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>(Severity.High);
  const [affectedComponent, setAffectedComponent] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [proofOfConcept, setProofOfConcept] = useState("");
  const [remediation, setRemediation] = useState("");

  // Cryptographic & submission progress
  const [encryptionResult, setEncryptionResult] = useState<EncryptionResult | null>(null);
  const [storageRef, setStorageRef] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<number | null>(null);

  const handleEncryptAndPrepare = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activeAccount) {
      setErrorMsg("Please connect your BridgeKey Wallet to submit an encrypted report.");
      return;
    }

    if (!title.trim() || !description.trim() || !affectedComponent.trim()) {
      setErrorMsg("Please fill in all mandatory disclosure fields.");
      return;
    }

    try {
      setIsProcessing(true);
      setProgressMsg("Generating 256-bit AES-GCM key and canonical nonce in browser...");

      const nonce = VeilEncryptionService.generateNonce();
      const payload: VulnerabilityPlaintext = {
        programId,
        title: title.trim(),
        severity,
        affectedComponent: affectedComponent.trim(),
        description: description.trim(),
        impact: impact.trim(),
        proofOfConcept: proofOfConcept.trim(),
        remediationRecommendation: remediation.trim(),
        researcherAddress: activeAccount,
        nonce,
        timestamp: Date.now(),
      };

      // 1. Perform local authenticated encryption
      const encrypted = await VeilEncryptionService.encryptReport(payload);
      setEncryptionResult(encrypted);

      setStep(2);
    } catch (err: any) {
      setErrorMsg(`Encryption error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadAndRegister = async () => {
    if (!encryptionResult || !activeAccount) return;

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // 2. Upload only ciphertext to persistent backend storage
      setProgressMsg("Uploading authenticated ciphertext to persistent storage...");
      const storageRes = await VeilApiService.storeEncryptedReport({
        programId,
        researcher: activeAccount,
        commitment: encryptionResult.commitment,
        ciphertext: encryptionResult.ciphertextBase64,
        iv: encryptionResult.ivBase64,
        wrappedKey: encryptionResult.wrappedKeyBase64,
        metadata: {
          severity,
          submittedAt: Date.now(),
        },
      });

      setStorageRef(storageRes.storageRef);

      // 3. Register cryptographic commitment on MST Coral Testnet
      setProgressMsg("Requesting transaction signature in BridgeKey for Coral Testnet...");
      const receipt = await onSubmitOnChain(
        programId,
        encryptionResult.commitment,
        storageRes.storageRef,
        severity
      );

      setCompletedTxHash(receipt.hash);

      // Extract report ID from receipt logs or fallback
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const reportIdParsed = parseInt(receipt.logs[0].topics[1], 16);
          if (!isNaN(reportIdParsed)) setSubmittedReportId(reportIdParsed);
        } catch {
          // ignore
        }
      }

      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.reason || err.message || "Failed to submit report on Coral.");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedProgram = programs.find((p) => p.id === programId);

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="border-b border-ivory-300 pb-4">
        <div className="flex items-center gap-2 text-2xs font-mono text-coral-600 uppercase tracking-widest font-semibold mb-1">
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy-Preserving Disclosure Flow</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-graphite-950">
          Submit Encrypted Vulnerability
        </h1>
        <p className="text-xs font-mono text-graphite-500 mt-1">
          Local AES-256-GCM authenticated encryption &bull; bytes32 on-chain commitment
        </p>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-3 gap-2 font-mono text-xs">
        <div
          className={`p-3 rounded border text-center transition-colors ${
            step === 1
              ? "bg-graphite-900 text-ivory-50 border-graphite-800 font-bold"
              : step > 1
              ? "bg-mint-100 text-mint-700 border-mint-300"
              : "bg-ivory-100 text-graphite-400 border-ivory-300"
          }`}
        >
          <span>1. Vulnerability Details</span>
        </div>

        <div
          className={`p-3 rounded border text-center transition-colors ${
            step === 2
              ? "bg-graphite-900 text-ivory-50 border-graphite-800 font-bold"
              : step > 2
              ? "bg-mint-100 text-mint-700 border-mint-300"
              : "bg-ivory-100 text-graphite-400 border-ivory-300"
          }`}
        >
          <span>2. Cryptographic Seal</span>
        </div>

        <div
          className={`p-3 rounded border text-center transition-colors ${
            step === 3
              ? "bg-mint-100 text-mint-800 border-mint-400 font-bold"
              : "bg-ivory-100 text-graphite-400 border-ivory-300"
          }`}
        >
          <span>3. Coral Registration</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded bg-red-100 border border-red-300 text-red-700 text-xs font-mono flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-2xs uppercase">Submission Error</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* STEP 1: Details Form */}
      {step === 1 && (
        <form onSubmit={handleEncryptAndPrepare} className="space-y-5 font-mono text-xs">
          {/* Program Select */}
          <div className="p-4 rounded bg-ivory-100 border border-ivory-300 space-y-2">
            <label className="block text-graphite-600 uppercase text-2xs font-bold">
              Target Bounty Program *
            </label>
            <select
              value={programId}
              onChange={(e) => setProgramId(Number(e.target.value))}
              className="w-full bg-ivory-50 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  Program #{p.id}: {p.title} (Reward: {p.minReward} &ndash; {p.maxReward} tMSTC)
                </option>
              ))}
            </select>
            {selectedProgram && (
              <p className="text-2xs text-graphite-500 font-sans mt-1">
                {selectedProgram.description}
              </p>
            )}
          </div>

          {/* Title & Severity */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-graphite-600 uppercase text-2xs font-bold mb-1">
                Report Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reentrancy in withdrawUnreservedFunds leads to drained escrow"
                required
                className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700"
              />
            </div>

            <div>
              <label className="block text-graphite-600 uppercase text-2xs font-bold mb-1">
                Severity *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700"
              >
                <option value={Severity.Low}>Low</option>
                <option value={Severity.Medium}>Medium</option>
                <option value={Severity.High}>High</option>
                <option value={Severity.Critical}>Critical</option>
              </select>
            </div>
          </div>

          {/* Affected Component */}
          <div>
            <label className="block text-graphite-600 uppercase text-2xs font-bold mb-1">
              Affected Component / Contract / File *
            </label>
            <input
              type="text"
              value={affectedComponent}
              onChange={(e) => setAffectedComponent(e.target.value)}
              placeholder="e.g. contracts/BugBountyEscrow.sol::withdrawUnreservedFunds"
              required
              className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-graphite-600 uppercase text-2xs font-bold mb-1">
              Vulnerability Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed technical breakdown of the vulnerability..."
              rows={4}
              required
              className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700 font-sans text-xs"
            />
          </div>

          {/* Impact & PoC */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-graphite-600 uppercase text-2xs font-bold mb-1">
                Impact Assessment
              </label>
              <textarea
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                placeholder="Direct consequence: unauthorized fund extraction, state corruption..."
                rows={3}
                className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700 font-sans text-xs"
              />
            </div>

            <div>
              <label className="block text-graphite-600 uppercase text-2xs font-bold mb-1">
                Proof of Concept / Steps to Reproduce
              </label>
              <textarea
                value={proofOfConcept}
                onChange={(e) => setProofOfConcept(e.target.value)}
                placeholder="1. Call function X with value Y... 2. Notice state Z..."
                rows={3}
                className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700 font-sans text-xs"
              />
            </div>
          </div>

          {/* Remediation */}
          <div>
            <label className="block text-graphite-600 uppercase text-2xs font-bold mb-1">
              Suggested Remediation
            </label>
            <input
              type="text"
              value={remediation}
              onChange={(e) => setRemediation(e.target.value)}
              placeholder="e.g. Implement Checks-Effects-Interactions and attach nonReentrant modifier"
              className="w-full bg-ivory-100 border border-ivory-300 rounded p-2.5 text-graphite-900 focus:outline-none focus:border-graphite-700 font-sans text-xs"
            />
          </div>

          {/* Submit Step 1 Button */}
          <div className="pt-4 border-t border-ivory-300 flex items-center justify-between">
            <span className="text-2xs text-graphite-500 font-mono">
              Report will be encrypted locally before leaving your browser.
            </span>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2.5 rounded bg-graphite-900 text-ivory-50 font-bold hover:bg-graphite-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-coral-400" />
                  <span>Encrypting in Browser...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-coral-400" />
                  <span>Encrypt & Inspect Commitment</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Cryptographic Seal Inspection & Confirm */}
      {step === 2 && encryptionResult && (
        <div className="space-y-6 font-mono text-xs">
          <div className="p-4 rounded bg-mint-50 border border-mint-300 text-mint-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-mint-600" />
              <span>Report Sealed via Authenticated AES-256-GCM</span>
            </div>
            <p className="text-2xs font-sans text-mint-700">
              The report details have been canonically serialized and encrypted locally. Review the
              cryptographic parameters below before broadcasting the commitment to MST Coral Testnet.
            </p>
          </div>

          <div className="bg-ivory-100 border border-ivory-300 rounded p-4 space-y-3">
            <div>
              <span className="text-2xs uppercase text-graphite-500 block font-bold">
                Cryptographic Commitment (EVM bytes32 on Coral)
              </span>
              <code className="text-xs text-coral-600 font-bold break-all block mt-0.5 select-all">
                {encryptionResult.commitment}
              </code>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-ivory-200">
              <div>
                <span className="text-2xs uppercase text-graphite-500 block">Ciphertext SHA-256</span>
                <span className="text-2xs text-graphite-700 break-all select-all font-mono">
                  {encryptionResult.sha256Hash}
                </span>
              </div>
              <div>
                <span className="text-2xs uppercase text-graphite-500 block">Initialization Vector (IV)</span>
                <span className="text-2xs text-graphite-700 break-all select-all font-mono">
                  {encryptionResult.ivBase64}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-ivory-200">
              <span className="text-2xs uppercase text-graphite-500 block">
                Ciphertext Sample (Preview)
              </span>
              <p className="text-2xs text-graphite-600 font-mono break-all line-clamp-2 mt-0.5">
                {encryptionResult.ciphertextBase64}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-ivory-200 rounded border border-ivory-300 text-2xs text-graphite-700 font-sans leading-relaxed">
            <strong>Security Notice:</strong> Clicking &ldquo;Confirm & Register on Coral&rdquo; will upload the
            ciphertext to private storage and prompt BridgeKey Wallet to execute{" "}
            <code>submitReport(programId, commitment, storageRef, severity)</code> on MST Coral Testnet.
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              disabled={isProcessing}
              className="px-4 py-2 rounded text-graphite-600 hover:text-graphite-900"
            >
              &larr; Back to Edit
            </button>

            <button
              onClick={handleUploadAndRegister}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded bg-graphite-900 text-ivory-50 font-bold hover:bg-graphite-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-coral-400" />
                  <span>{progressMsg || "Registering on Coral..."}</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-coral-400" />
                  <span>Confirm & Register on Coral Testnet</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Submission Confirmed Receipt */}
      {step === 3 && (
        <div className="space-y-6 font-mono text-xs">
          <div className="p-6 rounded bg-ivory-100 border border-ivory-300 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-mint-100 border border-mint-300 flex items-center justify-center text-mint-600 mx-auto">
              <FileCheck2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-graphite-950">
                Vulnerability Report Registered
              </h2>
              <p className="text-xs text-graphite-500 font-mono mt-1">
                Transaction confirmed on MST Coral Testnet via BridgeKey
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-ivory-50 border border-ivory-300 rounded p-4 text-left space-y-2 text-2xs">
              {submittedReportId && (
                <div className="flex justify-between items-center font-bold text-graphite-900">
                  <span>Report ID:</span>
                  <span className="text-coral-600">#{submittedReportId}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-graphite-600">
                <span>Program:</span>
                <span>Program #{programId}</span>
              </div>
              <div className="flex justify-between items-center text-graphite-600">
                <span>Storage Reference:</span>
                <span className="break-all">{storageRef}</span>
              </div>
              {completedTxHash && (
                <div className="pt-2 border-t border-ivory-200">
                  <span className="block text-graphite-500 mb-1">Coral Transaction Hash:</span>
                  <span className="break-all text-graphite-800 select-all font-mono">
                    {completedTxHash}
                  </span>
                </div>
              )}
            </div>

            {completedTxHash && (
              <a
                href={`${CORAL_CONFIG.blockExplorer}/tx/${completedTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-coral-600 hover:text-coral-700 underline font-semibold"
              >
                <span>View Receipt on Coral Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => onNavigate("researcher")}
                className="px-5 py-2.5 rounded bg-graphite-900 text-ivory-50 font-bold hover:bg-graphite-800 transition-colors"
              >
                Go to Researcher Workspace
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setTitle("");
                  setDescription("");
                  setProofOfConcept("");
                  setEncryptionResult(null);
                  setStorageRef(null);
                }}
                className="px-4 py-2.5 rounded bg-ivory-200 text-graphite-800 hover:bg-ivory-300 border border-ivory-400 transition-colors"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

