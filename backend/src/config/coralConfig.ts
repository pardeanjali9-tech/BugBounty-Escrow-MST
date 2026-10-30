import * as path from "path";
import * as fs from "fs";

export interface CoralNetworkConfig {
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
  compatibility: {
    evm: string;
    solidity: string;
  };
}

const sharedConfigPath = path.resolve(__dirname, "../../../shared/coralNetworkConfig.json");

let loadedConfig: CoralNetworkConfig;

try {
  if (fs.existsSync(sharedConfigPath)) {
    loadedConfig = JSON.parse(fs.readFileSync(sharedConfigPath, "utf-8"));
  } else {
    loadedConfig = {
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
      compatibility: {
        evm: "Osaka / Geth v1.7.8+",
        solidity: "^0.8.20",
      },
    };
  }
} catch {
  loadedConfig = {
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
    compatibility: {
      evm: "Osaka / Geth v1.7.8+",
      solidity: "^0.8.20",
    },
  };
}

// Override with process.env if provided
if (process.env.CORAL_RPC_URL) {
  loadedConfig.rpcUrls.http = process.env.CORAL_RPC_URL;
}

export const coralConfig: CoralNetworkConfig = loadedConfig;

