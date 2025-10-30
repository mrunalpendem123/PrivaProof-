import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";
  
  // Get the contract
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const registry = DIDRegistry.attach(contractAddress);
  
  console.log("Testing DIDRegistry contract at:", contractAddress);
  console.log("");
  
  // Test DID
  const testDID = "did:key:z6Mktest123";
  const testVCHash = ethers.keccak256(ethers.toUtf8Bytes("test VC"));
  
  // Test data (matching the frontend test data)
  const nullifierSeed = 12345;
  const nullifier = 67890;
  const timestamp = Math.floor(Date.now() / 1000);
  const signal = 11111;
  const revealArray = [1, 1, 0, 1];
  const groth16Proof = [1, 2, 3, 4, 5, 6, 7, 8];
  
  console.log("Registering DID:", testDID);
  console.log("VC Hash:", testVCHash);
  console.log("");
  
  try {
    const tx = await registry.registerDID(
      testDID,
      testVCHash,
      nullifierSeed,
      nullifier,
      timestamp,
      signal,
      revealArray,
      groth16Proof
    );
    
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed! Block:", receipt?.blockNumber);
    console.log("Gas used:", receipt?.gasUsed?.toString());
    console.log("");
    
    // Query the credential
    console.log("Querying credential for DID:", testDID);
    const cred = await registry.getCredential(testDID);
    console.log("Credential found:");
    console.log("  vcHash:", cred.vcHash);
    console.log("  timestamp:", cred.timestamp.toString());
    console.log("  isValid:", cred.isValid);
    
    if (Number(cred.timestamp) > 0) {
      console.log("\n✅ SUCCESS! DID was stored and retrieved successfully!");
    } else {
      console.log("\n❌ FAILED! DID was not stored (timestamp is 0)");
    }
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

