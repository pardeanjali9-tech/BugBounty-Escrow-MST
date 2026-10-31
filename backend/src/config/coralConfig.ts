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

const isMainnet = process.env.NETWORK === "mainnet" || process.env.MST_NETWORK === "mainnet";

export const coralConfig: CoralNetworkConfig = isMainnet
  ? {
      networkName: "MST Blockchain Mainnet",
      chainId: 4646,
      chainIdHex: "0x1226",
      rpcUrls: {
        http: process.env.MST_MAINNET_RPC_URL || "https://mariorpc.mstblockchain.com",
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
      compatibility: {
        evm: "Osaka / Geth v1.7.8+",
        solidity: "^0.8.20",
      },
    }
  : {
      networkName: "MST Coral Testnet",
      chainId: 54635,
      chainIdHex: "0xd56b",
      rpcUrls: {
        http: process.env.CORAL_RPC_URL || "https://coralrpc.mstblockchain.com",
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
