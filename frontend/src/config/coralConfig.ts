export interface CoralConfig {
  networkName: string;
  chainId: number;
  chainIdHex: string;
  rpcUrls: {
    http: string;
    ws: string;
  };
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  faucetUrl: string;
  documentation: string;
  wallet: {
    supportedWallet: string;
    supportedRdns: string[];
    windowFlags: string[];
    requiredProperty: string;
  };
}

export const MST_MAINNET_CONFIG: CoralConfig = {
  networkName: "MST Blockchain Mainnet",
  chainId: 4646,
  chainIdHex: "0x1226",
  rpcUrls: {
    http: "https://mariorpc.mstblockchain.com",
    ws: "wss://mariorpc.mstblockchain.com",
  },
  nativeCurrency: {
    name: "MST Coin",
    symbol: "MSTC",
    decimals: 18,
  },
  blockExplorer: "https://mstscan.com",
  faucetUrl: "",
  documentation: "https://mstblockchain.com",
  wallet: {
    supportedWallet: "BridgeKey",
    supportedRdns: ["io.bridgekey", "io.bridgekey.wallet"],
    windowFlags: ["bridgekey", "bridgeKey"],
    requiredProperty: "isBridgeKey",
  },
};

export const CORAL_TESTNET_CONFIG: CoralConfig = {
  networkName: "MST Coral Testnet",
  chainId: 54635,
  chainIdHex: "0xd56b",
  rpcUrls: {
    http: "https://coralrpc.mstblockchain.com",
    ws: "wss://coralrpc.mstblockchain.com",
  },
  nativeCurrency: {
    name: "MST Coral Token",
    symbol: "tMSTC",
    decimals: 18,
  },
  blockExplorer: "https://coral.mstscan.com",
  faucetUrl: "https://coral-faucet.mstblockchain.com",
  documentation: "https://mstblockchain.com",
  wallet: {
    supportedWallet: "BridgeKey",
    supportedRdns: ["io.bridgekey", "io.bridgekey.wallet"],
    windowFlags: ["bridgekey", "bridgeKey"],
    requiredProperty: "isBridgeKey",
  },
};

// Default active network: MST Mainnet (Chain ID 4646)
export const CORAL_CONFIG: CoralConfig =
  import.meta.env.VITE_NETWORK === "coral" ? CORAL_TESTNET_CONFIG : MST_MAINNET_CONFIG;

// Deployed contract address
export const ESCROW_CONTRACT_ADDRESS =
  import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const BACKEND_API_URL =
  import.meta.env.VITE_BACKEND_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "/api"
    : "http://localhost:4000/api");

export const BUGBOUNTY_ESCROW_ABI = [
  "event ProgramCreated(uint256 indexed programId, address indexed owner, string title, uint256 minReward, uint256 maxReward, bool allowsAppeal, uint256 initialDeposit)",
  "event ProgramFunded(uint256 indexed programId, address indexed funder, uint256 amount, uint256 newTotalFunded)",
  "event ReviewerUpdated(uint256 indexed programId, address indexed reviewer, bool authorized)",
  "event ProgramClosed(uint256 indexed programId, address indexed owner)",
  "event FundsWithdrawn(uint256 indexed programId, address indexed owner, uint256 amount, uint256 remainingFunds)",
  "event ReportSubmitted(uint256 indexed reportId, uint256 indexed programId, address indexed researcher, bytes32 commitment, string encryptedReportRef, uint8 severity, uint256 timestamp)",
  "event ReportReviewStarted(uint256 indexed reportId, address indexed reviewer, uint256 timestamp)",
  "event ReportApproved(uint256 indexed reportId, address indexed reviewer, uint256 rewardAmount, uint256 timestamp)",
  "event ReportRejected(uint256 indexed reportId, address indexed reviewer, string reason, uint256 timestamp)",
  "event ReportAppealed(uint256 indexed reportId, address indexed researcher, string appealRef, uint256 timestamp)",
  "event RewardClaimed(uint256 indexed reportId, address indexed researcher, uint256 amount, uint256 timestamp)",

  "function createProgram(string memory title, string memory description, uint256 minReward, uint256 maxReward, bool allowsAppeal) external payable returns (uint256)",
  "function fundProgram(uint256 programId) external payable",
  "function setReviewer(uint256 programId, address reviewer, bool authorized) external",
  "function closeProgram(uint256 programId) external",
  "function withdrawUnreservedFunds(uint256 programId, uint256 amount) external",
  "function submitReport(uint256 programId, bytes32 commitment, string memory encryptedReportRef, uint8 severity) external returns (uint256)",
  "function startReview(uint256 reportId) external",
  "function approveReport(uint256 reportId, uint256 rewardAmount) external",
  "function rejectReport(uint256 reportId, string memory reason) external",
  "function appealReport(uint256 reportId, string memory appealRef) external",
  "function claimReward(uint256 reportId) external",

  "function getProgram(uint256 programId) external view returns (tuple(uint256 id, address owner, string title, string description, uint256 minReward, uint256 maxReward, bool allowsAppeal, bool active, uint256 totalFunded, uint256 reservedRewards, uint256 paidRewards, uint256 createdAt))",
  "function getProgramCount() external view returns (uint256)",
  "function getReport(uint256 reportId) external view returns (tuple(uint256 id, uint256 programId, address researcher, bytes32 commitment, string encryptedReportRef, uint8 severity, uint8 status, uint256 submittedAt, uint256 reviewedAt, address reviewer, uint256 approvedReward, string rejectionReason, string appealRef))",
  "function getReportCount() external view returns (uint256)",
  "function getAvailableFunds(uint256 programId) external view returns (uint256)",
  "function isReviewer(uint256 programId, address reviewer) external view returns (bool)",
  "function getProgramReports(uint256 programId) external view returns (uint256[] memory)",
  "function getResearcherReports(address researcher) external view returns (uint256[] memory)"
];
