import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("====================================================");
  console.log("VEIL BugBountyEscrow MAINNET Deployment");
  console.log(`Target Network: MST Blockchain Mainnet (Chain ID: 4646)`);
  console.log("====================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer account configured. Set PRIVATE_KEY in contracts/.env or environment variables."
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`Account Balance:  ${ethers.formatEther(balance)} MSTC`);

  if (balance === 0n) {
    console.error("ERROR: Deployer account has 0 MSTC on MST Blockchain Mainnet.");
    console.error("Deploying to mainnet requires real MSTC tokens to pay transaction gas fees.");
    console.error("Please fund this address with MSTC before running deployment.");
    process.exit(1);
  }

  console.log("Deploying BugBountyEscrow contract to MST Mainnet...");
  const BugBountyEscrowFactory = await ethers.getContractFactory("BugBountyEscrow");
  const escrow = await BugBountyEscrowFactory.deploy();

  await escrow.waitForDeployment();
  const contractAddress = await escrow.getAddress();
  const deployTx = escrow.deploymentTransaction();

  console.log("====================================================");
  console.log("CONTRACT DEPLOYED SUCCESSFULLY TO MST MAINNET!");
  console.log(`Contract Address: ${contractAddress}`);
  if (deployTx) {
    console.log(`Deploy Tx Hash:   ${deployTx.hash}`);
    console.log(`MST Explorer:     https://mstscan.com/tx/${deployTx.hash}`);
    console.log(`Contract Link:    https://mstscan.com/address/${contractAddress}`);
  }
  console.log("====================================================");

  // Save deployment metadata
  const deploymentInfo = {
    network: "mstMainnet",
    chainId: 4646,
    contractAddress: contractAddress,
    transactionHash: deployTx ? deployTx.hash : null,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    explorerUrl: `https://mstscan.com/address/${contractAddress}`,
  };

  const deploymentsPath = path.join(__dirname, "../deployments-mainnet.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Mainnet deployment metadata written to: ${deploymentsPath}`);

  // Sync to frontend and backend config
  const frontendConfigPath = path.join(__dirname, "../../frontend/src/config/contractAddress.json");
  const backendConfigPath = path.join(__dirname, "../../backend/src/config/contractAddress.json");

  try {
    fs.writeFileSync(frontendConfigPath, JSON.stringify(deploymentInfo, null, 2));
    fs.writeFileSync(backendConfigPath, JSON.stringify(deploymentInfo, null, 2));
  } catch (err) {
    // optional sync
  }
}

main().catch((error) => {
  console.error("Mainnet deployment failed:", error);
  process.exitCode = 1;
});
