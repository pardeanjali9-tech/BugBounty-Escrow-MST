import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import {
  CORAL_CONFIG,
  ESCROW_CONTRACT_ADDRESS,
  BUGBOUNTY_ESCROW_ABI,
} from "../config/coralConfig";
import { Program, Report, TransactionRecord } from "../types";

export function useVeilEscrow(getEthersSigner: () => Promise<ethers.Signer>, activeAccount: string | null) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTx, setActiveTx] = useState<TransactionRecord | null>(null);
  const [txHistory, setTxHistory] = useState<TransactionRecord[]>([]);

  // Public read-only Coral JsonRpcProvider
  const getReadOnlyContract = useCallback(() => {
    const provider = new ethers.JsonRpcProvider(CORAL_CONFIG.rpcUrls.http, {
      chainId: CORAL_CONFIG.chainId,
      name: CORAL_CONFIG.networkName,
    });
    return new ethers.Contract(ESCROW_CONTRACT_ADDRESS, BUGBOUNTY_ESCROW_ABI, provider);
  }, []);

  // Write contract bound to connected BridgeKey Signer
  const getWriteContract = useCallback(async () => {
    const signer = await getEthersSigner();
    return new ethers.Contract(ESCROW_CONTRACT_ADDRESS, BUGBOUNTY_ESCROW_ABI, signer);
  }, [getEthersSigner]);

  /**
   * Helper to execute and track on-chain transactions
   */
  const executeTx = useCallback(
    async (
      actionName: string,
      txMethod: (contract: ethers.Contract) => Promise<ethers.ContractTransactionResponse>
    ): Promise<ethers.ContractTransactionReceipt> => {
      try {
        const contract = await getWriteContract();
        const tx = await txMethod(contract);

        const record: TransactionRecord = {
          hash: tx.hash,
          action: actionName,
          status: "pending",
          timestamp: Date.now(),
          explorerUrl: `${CORAL_CONFIG.blockExplorer}/tx/${tx.hash}`,
        };

        setActiveTx(record);
        setTxHistory((prev) => [record, ...prev]);

        // Wait for Coral block confirmation
        const receipt = await tx.wait(1);
        if (!receipt) {
          throw new Error("Transaction dropped or failed to confirm on MST Coral Testnet.");
        }

        const completedRecord: TransactionRecord = {
          ...record,
          status: receipt.status === 1 ? "success" : "reverted",
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        };

        setActiveTx(completedRecord);
        setTxHistory((prev) =>
          prev.map((item) => (item.hash === tx.hash ? completedRecord : item))
        );

        if (receipt.status !== 1) {
          throw new Error("MST Coral on-chain transaction reverted.");
        }

        return receipt;
      } catch (err: any) {
        console.error(`Transaction failed for ${actionName}:`, err);
        const errorRecord: TransactionRecord = {
          hash: "failed",
          action: actionName,
          status: "failed",
          timestamp: Date.now(),
          details: err.reason || err.message || "Transaction rejected or failed",
          explorerUrl: CORAL_CONFIG.blockExplorer,
        };
        setActiveTx(errorRecord);
        throw err;
      }
    },
    [getWriteContract]
  );

  /**
   * Load all programs from contract
   */
  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const contract = getReadOnlyContract();
      const countBig = await contract.getProgramCount();
      const count = Number(countBig);

      const items: Program[] = [];
      for (let i = 1; i <= count; i++) {
        try {
          const raw = await contract.getProgram(i);
          const availableFundsWei = await contract.getAvailableFunds(i);

          items.push({
            id: Number(raw.id),
            owner: raw.owner,
            title: raw.title,
            description: raw.description,
            minReward: ethers.formatEther(raw.minReward),
            maxReward: ethers.formatEther(raw.maxReward),
            minRewardWei: raw.minReward,
            maxRewardWei: raw.maxReward,
            allowsAppeal: raw.allowsAppeal,
            active: raw.active,
            totalFunded: ethers.formatEther(raw.totalFunded),
            reservedRewards: ethers.formatEther(raw.reservedRewards),
            paidRewards: ethers.formatEther(raw.paidRewards),
            availableFunds: ethers.formatEther(availableFundsWei),
            totalFundedWei: raw.totalFunded,
            reservedRewardsWei: raw.reservedRewards,
            paidRewardsWei: raw.paidRewards,
            availableFundsWei: availableFundsWei,
            createdAt: Number(raw.createdAt) * 1000,
          });
        } catch (e) {
          console.warn(`Error fetching program ${i}:`, e);
        }
      }

      setPrograms(items);
    } catch (err) {
      console.warn("Failed to load on-chain programs (Contract may not yet be deployed or configured):", err);
      // Fallback to initial display data if contract not reached
      setPrograms([
        {
          id: 1,
          owner: "0x1A8FbDE6F22eEa75A519c7f1a30aCe891b98B001",
          title: "VEIL Core Protocol & Escrow Smart Contracts",
          description: "Responsible vulnerability disclosure for BugBountyEscrow contracts, state machine logic, and cryptographic commitment verifications.",
          minReward: "0.1",
          maxReward: "2.0",
          minRewardWei: ethers.parseEther("0.1"),
          maxRewardWei: ethers.parseEther("2.0"),
          allowsAppeal: true,
          active: true,
          totalFunded: "5.0",
          reservedRewards: "0.0",
          paidRewards: "0.0",
          availableFunds: "5.0",
          totalFundedWei: ethers.parseEther("5.0"),
          reservedRewardsWei: 0n,
          paidRewardsWei: 0n,
          availableFundsWei: ethers.parseEther("5.0"),
          createdAt: Date.now() - 86400000,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [getReadOnlyContract]);

  /**
   * Load all reports from contract
   */
  const loadReports = useCallback(async () => {
    try {
      const contract = getReadOnlyContract();
      const countBig = await contract.getReportCount();
      const count = Number(countBig);

      const items: Report[] = [];
      for (let i = 1; i <= count; i++) {
        try {
          const raw = await contract.getReport(i);
          items.push({
            id: Number(raw.id),
            programId: Number(raw.programId),
            researcher: raw.researcher,
            commitment: raw.commitment,
            encryptedReportRef: raw.encryptedReportRef,
            severity: Number(raw.severity),
            status: Number(raw.status),
            submittedAt: Number(raw.submittedAt) * 1000,
            reviewedAt: Number(raw.reviewedAt) * 1000,
            reviewer: raw.reviewer,
            approvedReward: ethers.formatEther(raw.approvedReward),
            approvedRewardWei: raw.approvedReward,
            rejectionReason: raw.rejectionReason,
            appealRef: raw.appealRef,
          });
        } catch (e) {
          console.warn(`Error fetching report ${i}:`, e);
        }
      }
      setReports(items);
    } catch (err) {
      console.warn("Failed to load on-chain reports:", err);
    }
  }, [getReadOnlyContract]);

  // Initial load
  useEffect(() => {
    loadPrograms();
    loadReports();
  }, [loadPrograms, loadReports]);

  // Smart Contract Transaction methods:
  const createProgram = async (
    title: string,
    description: string,
    minRewardWei: bigint,
    maxRewardWei: bigint,
    allowsAppeal: boolean,
    initialDepositWei: bigint
  ) => {
    const receipt = await executeTx("Create Bug Bounty Program", (contract) =>
      contract.createProgram(title, description, minRewardWei, maxRewardWei, allowsAppeal, {
        value: initialDepositWei,
      })
    );
    await loadPrograms();
    return receipt;
  };

  const fundProgram = async (programId: number, amountWei: bigint) => {
    const receipt = await executeTx(`Fund Program #${programId}`, (contract) =>
      contract.fundProgram(programId, { value: amountWei })
    );
    await loadPrograms();
    return receipt;
  };

  const setReviewer = async (programId: number, reviewer: string, authorized: boolean) => {
    const receipt = await executeTx(`Authorize Reviewer on Program #${programId}`, (contract) =>
      contract.setReviewer(programId, reviewer, authorized)
    );
    return receipt;
  };

  const closeProgram = async (programId: number) => {
    const receipt = await executeTx(`Close Program #${programId}`, (contract) =>
      contract.closeProgram(programId)
    );
    await loadPrograms();
    return receipt;
  };

  const withdrawUnreservedFunds = async (programId: number, amountWei: bigint) => {
    const receipt = await executeTx(`Withdraw Unreserved Escrow Funds`, (contract) =>
      contract.withdrawUnreservedFunds(programId, amountWei)
    );
    await loadPrograms();
    return receipt;
  };

  const submitReport = async (
    programId: number,
    commitment: string,
    encryptedReportRef: string,
    severity: number
  ) => {
    const receipt = await executeTx(`Submit Encrypted Report to Program #${programId}`, (contract) =>
      contract.submitReport(programId, commitment, encryptedReportRef, severity)
    );
    await loadReports();
    return receipt;
  };

  const startReview = async (reportId: number) => {
    const receipt = await executeTx(`Initiate Review for Report #${reportId}`, (contract) =>
      contract.startReview(reportId)
    );
    await loadReports();
    return receipt;
  };

  const approveReport = async (reportId: number, rewardAmountWei: bigint) => {
    const receipt = await executeTx(`Approve Report #${reportId} and Lock Escrow Reward`, (contract) =>
      contract.approveReport(reportId, rewardAmountWei)
    );
    await loadReports();
    await loadPrograms();
    return receipt;
  };

  const rejectReport = async (reportId: number, reason: string) => {
    const receipt = await executeTx(`Reject Report #${reportId}`, (contract) =>
      contract.rejectReport(reportId, reason)
    );
    await loadReports();
    return receipt;
  };

  const appealReport = async (reportId: number, appealRef: string) => {
    const receipt = await executeTx(`Appeal Rejection for Report #${reportId}`, (contract) =>
      contract.appealReport(reportId, appealRef)
    );
    await loadReports();
    return receipt;
  };

  const claimReward = async (reportId: number) => {
    const receipt = await executeTx(`Claim Pull-Payment Bounty for Report #${reportId}`, (contract) =>
      contract.claimReward(reportId)
    );
    await loadReports();
    await loadPrograms();
    return receipt;
  };

  return {
    programs,
    reports,
    loading,
    activeTx,
    clearActiveTx: () => setActiveTx(null),
    txHistory,
    loadPrograms,
    loadReports,
    createProgram,
    fundProgram,
    setReviewer,
    closeProgram,
    withdrawUnreservedFunds,
    submitReport,
    startReview,
    approveReport,
    rejectReport,
    appealReport,
    claimReward,
  };
}

