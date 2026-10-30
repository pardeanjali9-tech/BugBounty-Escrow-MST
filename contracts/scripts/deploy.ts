import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("----------------------------------------------------");
  console.log("VEIL BugBountyEscrow Deployment");
  console.log(`Target Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log("----------------------------------------------------");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer account configured. Set PRIVATE_KEY in environment or .env file."
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`Account Balance:  ${ethers.formatEther(balance)} tMSTC`);

  if (balance === 0n && network.name === "coral") {
    console.error("BLOCKER: Deployer account has 0 tMSTC balance on MST Coral Testnet.");
    console.error("Please request testnet tokens from the official faucet: https://coral-faucet.mstblockchain.com");
    process.exit(1);
  }

  console.log("Deploying BugBountyEscrow contract...");
  const BugBountyEscrowFactory = await ethers.getContractFactory("BugBountyEscrow");
  const escrow = await BugBountyEscrowFactory.deploy();

  await escrow.waitForDeployment();
  const contractAddress = await escrow.getAddress();
  const deployTx = escrow.deploymentTransaction();

  console.log("----------------------------------------------------");
  console.log(`CONTRACT DEPLOYED SUCCESSFULLY!`);
  console.log(`Contract Address: ${contractAddress}`);
  if (deployTx) {
    console.log(`Deploy Tx Hash:   ${deployTx.hash}`);
    if (network.config.chainId === 54635) {
      console.log(`Coral Explorer:   https://coral.mstscan.com/tx/${deployTx.hash}`);
      console.log(`Contract Link:    https://coral.mstscan.com/address/${contractAddress}`);
    }
  }
  console.log("----------------------------------------------------");

  // Save deployment metadata
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: contractAddress,
    transactionHash: deployTx ? deployTx.hash : null,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    explorerUrl: network.config.chainId === 54635 ? `https://coral.mstscan.com/address/${contractAddress}` : null,
  };

  const deploymentsPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment metadata written to: ${deploymentsPath}`);

  // Also write to frontend and backend shared config if present
  const frontendConfigPath = path.join(__dirname, "../../frontend/src/config/contractAddress.json");
  const backendConfigPath = path.join(__dirname, "../../backend/src/config/contractAddress.json");

  try {
    const parentDir = path.dirname(frontendConfigPath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(frontendConfigPath, JSON.stringify(deploymentInfo, null, 2));

    const backendParentDir = path.dirname(backendConfigPath);
    if (!fs.existsSync(backendParentDir)) fs.mkdirSync(backendParentDir, { recursive: true });
    fs.writeFileSync(backendConfigPath, JSON.stringify(deploymentInfo, null, 2));
  } catch (err) {
    // optional sync
  }
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

