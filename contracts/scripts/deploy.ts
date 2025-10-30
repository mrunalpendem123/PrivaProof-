import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Note: For a real deployment, we'd need to deploy the Groth16 verifier first
  // For now, we'll use a placeholder address - you'll need to deploy the verifier separately
  // The verifier can be generated from Anon Aadhaar's circom circuits
  
  console.log("\n⚠️  NOTE: You need to deploy AnonAadhaar verifier first!");
  console.log("For now, using placeholder address. Update with real verifier address.");
  
  // Placeholder - replace with actual verifier address after deployment
  const VERIFIER_ADDRESS = "0x0000000000000000000000000000000000000000";
  const PUBKEY_HASH = ethers.ZeroHash; // Placeholder pubkey hash

  // Deploy AnonAadhaar contract
  console.log("\nDeploying AnonAadhaar contract...");
  const AnonAadhaar = await ethers.getContractFactory("AnonAadhaar");
  const anonAadhaar = await AnonAadhaar.deploy(VERIFIER_ADDRESS, PUBKEY_HASH);
  await anonAadhaar.waitForDeployment();
  const anonAadhaarAddress = await anonAadhaar.getAddress();
  console.log("AnonAadhaar deployed to:", anonAadhaarAddress);
  
  // Deploy DID Registry
  console.log("\nDeploying DIDRegistry contract...");
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const registry = await DIDRegistry.deploy(anonAadhaarAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("DIDRegistry deployed to:", registryAddress);

  console.log("\n✅ Deployment complete!");
  console.log("\nContract addresses:");
  console.log("- AnonAadhaar:", anonAadhaarAddress);
  console.log("- DIDRegistry:", registryAddress);
  console.log("\n⚠️  Remember to update VERIFIER_ADDRESS with real verifier contract!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

