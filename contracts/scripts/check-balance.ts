import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  
  console.log("Wallet Address:", address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("\n❌ No ETH! Please get test ETH from:");
    console.log("https://sepoliafaucet.com/");
    console.log("Enter this address:", address);
  } else {
    console.log("\n✅ You have test ETH! Ready to deploy.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
