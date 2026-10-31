import { ethers } from "hardhat";

async function main() {
  console.log("====================================================");
  console.log("MST BLOCKCHAIN MAINNET CONNECTIVITY VERIFICATION");
  console.log("====================================================");

  const provider = ethers.provider;
  const network = await provider.getNetwork();
  console.log(`Reported Chain ID: ${network.chainId.toString()} (Expected: 4646 / 0x1226)`);

  if (network.chainId !== 4646n) {
    console.error("ERROR: Connected RPC chain ID does not match MST Mainnet!");
    process.exit(1);
  }

  const blockNumber = await provider.getBlockNumber();
  console.log(`Latest Block Number: ${blockNumber}`);

  const feeData = await provider.getFeeData();
  console.log(`Current Gas Price:   ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "N/A"} gwei`);

  const signers = await ethers.getSigners();
  if (signers.length > 0) {
    const balance = await provider.getBalance(signers[0].address);
    console.log(`Deployer Address:    ${signers[0].address}`);
    console.log(`Deployer Balance:    ${ethers.formatEther(balance)} MSTC`);
  } else {
    console.log("Deployer Status:     No PRIVATE_KEY configured in environment.");
  }

  console.log("MST Mainnet RPC:     REACHABLE & VERIFIED");
  console.log("Block Explorer:      https://mstscan.com");
  console.log("Primary RPC:         https://mariorpc.mstblockchain.com");
  console.log("Secondary RPC:       https://craftrpc.mstblockchain.com");
  console.log("====================================================");
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exitCode = 1;
});

