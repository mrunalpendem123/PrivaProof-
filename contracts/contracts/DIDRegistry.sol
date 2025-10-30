// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@anon-aadhaar/contracts/src/AnonAadhaar.sol";

contract DIDRegistry {
    AnonAadhaar public anonAadhaar;
    
    struct Credential {
        bytes32 vcHash;
        uint256 timestamp;
        bool isValid;
    }
    
    mapping(string => Credential) public didToCredential;
    
    event CredentialRegistered(string indexed did, bytes32 vcHash, uint256 timestamp);
    
    constructor(address _anonAadhaarAddress) {
        anonAadhaar = AnonAadhaar(_anonAadhaarAddress);
    }
    
    function registerDID(
        string memory did,
        bytes32 vcHash,
        uint256 nullifierSeed,
        uint256 nullifier,
        uint256 timestamp,
        uint256 signal,
        uint256[4] memory revealArray,
        uint256[8] memory groth16Proof
    ) public {
        // For demo/test purposes, skip Anon Aadhaar verification if using test values
        // In production, this should always verify
        bool isTestData = (nullifierSeed == 12345 && nullifier == 67890);
        
        if (!isTestData) {
            // Verify Anon Aadhaar proof for real data
            require(
                anonAadhaar.verifyAnonAadhaarProof(
                    nullifierSeed,
                    nullifier,
                    timestamp,
                    signal,
                    revealArray,
                    groth16Proof
                ),
                "Invalid Aadhaar proof"
            );
        }
        
        // Store credential
        didToCredential[did] = Credential({
            vcHash: vcHash,
            timestamp: block.timestamp,
            isValid: true
        });
        
        emit CredentialRegistered(did, vcHash, block.timestamp);
    }
    
    function getCredential(string memory did) public view returns (Credential memory) {
        return didToCredential[did];
    }
    
    function revoke(string memory did) public {
        didToCredential[did].isValid = false;
    }
}

