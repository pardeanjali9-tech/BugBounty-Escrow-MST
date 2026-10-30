export enum Severity {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export enum ReportStatus {
  Submitted = 0,
  UnderReview = 1,
  Approved = 2,
  Rejected = 3,
  Appealed = 4,
  Claimed = 5,
}

export interface Program {
  id: number;
  owner: string;
  title: string;
  description: string;
  minReward: string; // in tMSTC
  maxReward: string; // in tMSTC
  minRewardWei: bigint;
  maxRewardWei: bigint;
  allowsAppeal: boolean;
  active: boolean;
  totalFunded: string;
  reservedRewards: string;
  paidRewards: string;
  availableFunds: string;
  totalFundedWei: bigint;
  reservedRewardsWei: bigint;
  paidRewardsWei: bigint;
  availableFundsWei: bigint;
  createdAt: number;
  policy?: string;
  reviewerPublicKey?: string;
}

export interface Report {
  id: number;
  programId: number;
  researcher: string;
  commitment: string;
  encryptedReportRef: string;
  severity: Severity;
  status: ReportStatus;
  submittedAt: number;
  reviewedAt: number;
  reviewer: string;
  approvedReward: string; // in tMSTC
  approvedRewardWei: bigint;
  rejectionReason: string;
  appealRef: string;
}

export interface VulnerabilityPlaintext {
  programId: number;
  title: string;
  severity: Severity;
  affectedComponent: string;
  description: string;
  impact: string;
  proofOfConcept: string;
  remediationRecommendation: string;
  researcherAddress: string;
  nonce: string;
  timestamp: number;
}

export interface EncryptedReportData {
  storageRef: string;
  id: string;
  programId: number;
  researcher: string;
  commitment: string;
  ciphertext: string;
  iv: string;
  wrappedKey: string;
  reviewerPublicKey?: string;
  metadata: {
    severity: number;
    submittedAt: number;
    titleCommitment?: string;
  };
  storedAt: string;
  sha256Fingerprint: string;
}

export interface TransactionRecord {
  hash: string;
  action: string;
  status: "pending" | "success" | "reverted" | "failed";
  timestamp: number;
  blockNumber?: number;
  gasUsed?: string;
  details?: string;
  explorerUrl: string;
}

export interface BridgeKeyWalletState {
  isInstalled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  balance: string;
  error: string | null;
}

