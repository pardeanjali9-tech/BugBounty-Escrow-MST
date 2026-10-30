import React, { useState } from "react";
import { Header } from "./components/Header";
import { BridgeKeyModal } from "./components/BridgeKeyModal";
import { TransactionModal } from "./components/TransactionModal";
import { ReportDetailModal } from "./components/ReportDetailModal";

import { LandingPage } from "./pages/LandingPage";
import { DashboardView } from "./pages/DashboardView";
import { ProgramsView } from "./pages/ProgramsView";
import { SubmitReportView } from "./pages/SubmitReportView";
import { ResearcherWorkspace } from "./pages/ResearcherWorkspace";
import { ReviewerWorkspace } from "./pages/ReviewerWorkspace";
import { OwnerWorkspace } from "./pages/OwnerWorkspace";
import { ActivityCenterView } from "./pages/ActivityCenterView";
import { SettingsView } from "./pages/SettingsView";

import { useBridgeKeyWallet } from "./hooks/useBridgeKeyWallet";
import { useVeilEscrow } from "./hooks/useVeilEscrow";
import { Report } from "./types";
import { CORAL_CONFIG } from "./config/coralConfig";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isBridgeKeyModalOpen, setIsBridgeKeyModalOpen] = useState<boolean>(false);
  const [isCreateProgramOpen, setIsCreateProgramOpen] = useState<boolean>(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<Report | null>(null);
  const [reportTargetProgramId, setReportTargetProgramId] = useState<number | undefined>(undefined);

  // 1. BridgeKey Wallet Hook (BridgeKey ONLY)
  const wallet = useBridgeKeyWallet();

  // 2. Escrow Smart Contract Hook
  const escrow = useVeilEscrow(wallet.getEthersSigner, wallet.account);

  const totalEscrowFormatted = escrow.programs
    .reduce((acc, p) => acc + parseFloat(p.totalFunded || "0"), 0)
    .toFixed(2);

  const handleSelectProgramForReport = (programId: number) => {
    setReportTargetProgramId(programId);
    setActiveTab("submit");
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col font-sans text-graphite-900 selection:bg-coral-100 selection:text-coral-600">
      {/* Header */}
      <Header
        wallet={wallet}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBridgeKeyModal={() => setIsBridgeKeyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8">
        {activeTab === "overview" && (
          <LandingPage
            onNavigate={setActiveTab}
            onConnectWallet={wallet.connect}
            isConnected={wallet.isConnected}
            totalEscrow={totalEscrowFormatted}
            activeProgramsCount={escrow.programs.filter((p) => p.active).length}
          />
        )}

        {activeTab === "dashboard" && (
          <DashboardView
            programs={escrow.programs}
            reports={escrow.reports}
            onNavigate={setActiveTab}
            onOpenCreateProgram={() => setIsCreateProgramOpen(true)}
            activeAccount={wallet.account}
          />
        )}

        {activeTab === "programs" && (
          <ProgramsView
            programs={escrow.programs}
            onCreateProgram={escrow.createProgram}
            onFundProgram={escrow.fundProgram}
            onSelectProgramForReport={handleSelectProgramForReport}
            activeAccount={wallet.account}
            isCreateOpen={isCreateProgramOpen}
            setIsCreateOpen={setIsCreateProgramOpen}
          />
        )}

        {activeTab === "submit" && (
          <SubmitReportView
            programs={escrow.programs}
            selectedProgramId={reportTargetProgramId}
            onSubmitOnChain={escrow.submitReport}
            activeAccount={wallet.account}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === "researcher" && (
          <ResearcherWorkspace
            reports={escrow.reports}
            activeAccount={wallet.account}
            onClaimReward={escrow.claimReward}
            onAppealReport={escrow.appealReport}
            onViewReportDetail={setSelectedReportDetail}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === "reviewer" && (
          <ReviewerWorkspace
            programs={escrow.programs}
            reports={escrow.reports}
            activeAccount={wallet.account}
            onStartReview={escrow.startReview}
            onApproveReport={escrow.approveReport}
            onRejectReport={escrow.rejectReport}
          />
        )}

        {activeTab === "owner" && (
          <OwnerWorkspace
            programs={escrow.programs}
            activeAccount={wallet.account}
            onSetReviewer={escrow.setReviewer}
            onCloseProgram={escrow.closeProgram}
            onWithdrawFunds={escrow.withdrawUnreservedFunds}
            onFundProgram={escrow.fundProgram}
          />
        )}

        {activeTab === "activity" && (
          <ActivityCenterView txHistory={escrow.txHistory} />
        )}

        {activeTab === "settings" && <SettingsView wallet={wallet} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-ivory-300 bg-ivory-100 text-graphite-600 py-8 px-4 sm:px-8 mt-16 font-mono text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-graphite-900 font-bold">
              <span>VEIL Protocol</span>
              <span className="text-2xs font-normal text-coral-600 bg-coral-100 px-1.5 py-0.2 rounded border border-coral-200">
                MST Coral Testnet Exclusive
              </span>
            </div>
            <p className="text-2xs text-graphite-500 font-sans">
              Cryptographically authenticated bug bounty escrow. All transactions signed via BridgeKey Wallet.
            </p>
          </div>

          <div className="flex items-center gap-4 text-2xs text-graphite-500">
            <a
              href={CORAL_CONFIG.blockExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-coral-600 transition-colors"
            >
              Coral Explorer
            </a>
            <span>&bull;</span>
            <a
              href={CORAL_CONFIG.faucetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-coral-600 transition-colors"
            >
              tMSTC Faucet
            </a>
            <span>&bull;</span>
            <a
              href="https://bridgekey.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-coral-600 transition-colors"
            >
              BridgeKey Wallet
            </a>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <BridgeKeyModal
        isOpen={isBridgeKeyModalOpen}
        onClose={() => setIsBridgeKeyModalOpen(false)}
        onRetryConnect={wallet.connect}
        detectedError={wallet.error}
      />

      <TransactionModal
        transaction={escrow.activeTx}
        onClose={escrow.clearActiveTx}
      />

      <ReportDetailModal
        report={selectedReportDetail}
        onClose={() => setSelectedReportDetail(null)}
      />
    </div>
  );
}

export default App;

