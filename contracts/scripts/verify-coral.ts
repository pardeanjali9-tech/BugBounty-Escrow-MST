import { ethers } from "hardhat";

async function main() {
  console.log("====================================================");
  console.log("MST CORAL TESTNET CONNECTIVITY VERIFICATION");
  console.log("====================================================");

  const provider = ethers.provider;
  const network = await provider.getNetwork();
  console.log(`Reported Chain ID: ${network.chainId.toString()} (Expected: 54635 / 0xd56b)`);

  if (network.chainId !== 54635n) {
    console.error("ERROR: Connected RPC chain ID does not match MST Coral Testnet!");
    process.exit(1);
  }

  const blockNumber = await provider.getBlockNumber();
  console.log(`Latest Block Number: ${blockNumber}`);

  const feeData = await provider.getFeeData();
  console.log(`Current Gas Price:   ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "N/A"} gwei`);

  const signers = await ethers.getSigners();
  if (signers.length > 0) {
    const balance = await provider.getBalance(signers[0].address);
    console.log(`Signer Address:      ${signers[0].address}`);
    console.log(`Signer Balance:      ${ethers.formatEther(balance)} tMSTC`);
  } else {
    console.log("Signer Status:       No private key provided in environment.");
  }

  console.log("MST Coral RPC Status: REACHABLE & VERIFIED");
  console.log("Block Explorer:      https://coral.mstscan.com");
  console.log("Faucet:              https://coral-faucet.mstblockchain.com");
  console.log("====================================================");
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exitCode = 1;
});

