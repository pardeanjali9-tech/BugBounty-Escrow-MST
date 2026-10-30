import { ethers } from "ethers";
import { coralConfig } from "../../backend/src/config/coralConfig";

async function main() {
  const wallet = ethers.Wallet.createRandom();
  console.log("====================================================");
  console.log("MST CORAL TESTNET NEW ACCOUNT GENERATOR");
  console.log("====================================================");
  console.log(`Address:     ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
  console.log("----------------------------------------------------");
  console.log("To fund this account with free testnet tokens:");
  console.log(`1. Visit the Coral Faucet: ${coralConfig.faucetUrl}`);
  console.log(`2. Paste your address:   ${wallet.address}`);
  console.log("3. Complete hCaptcha and claim free tMSTC.");
  console.log("4. Add PRIVATE_KEY=" + wallet.privateKey + " to your .env file.");
  console.log("5. Run: npm run deploy:coral --prefix contracts");
  console.log("====================================================");
}

main().catch(console.error);

