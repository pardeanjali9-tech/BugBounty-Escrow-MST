import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "shanghai",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    mstMainnet: {
      url: process.env.MST_MAINNET_RPC_URL || "https://mariorpc.mstblockchain.com",
      chainId: 4646,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei verified
    },
    coral: {
      url: process.env.CORAL_RPC_URL || "https://coralrpc.mstblockchain.com",
      chainId: 54635,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei verified
    },
  },
  etherscan: {
    apiKey: {
      mstMainnet: "empty",
      coral: "empty",
    },
    customChains: [
      {
        network: "mstMainnet",
        chainId: 4646,
        urls: {
          apiURL: "https://mstscan.com/api",
          browserURL: "https://mstscan.com",
        },
      },
      {
        network: "coral",
        chainId: 54635,
        urls: {
          apiURL: "https://coral.mstscan.com/api",
          browserURL: "https://coral.mstscan.com",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
