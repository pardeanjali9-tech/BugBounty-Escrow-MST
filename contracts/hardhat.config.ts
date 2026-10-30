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
    coral: {
      url: process.env.CORAL_RPC_URL || "https://coralrpc.mstblockchain.com",
      chainId: 54635,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei verified
    },
  },
  etherscan: {
    apiKey: {
      coral: "empty",
    },
    customChains: [
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

