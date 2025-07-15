const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Setting up token support with account:", deployer.address);
  
  // Your deployed contract address
  const executorAddress = "0xCA7c84C6Ca61f48fA04d7dBbA1649f269962997c";
  
  // Get contract instance
  const ZetaVaultExecutor = await ethers.getContractFactory("ZetaVaultExecutor");
  const executor = ZetaVaultExecutor.attach(executorAddress);
  
  // Check current owner
  const currentOwner = await executor.owner();
  console.log("Current contract owner:", currentOwner);
  console.log("Deployer address:", deployer.address);
  
  if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`You are not the contract owner. Current owner: ${currentOwner}`);
  }
  
  // ZRC20 tokens that need support
  const tokensToSupport = [
    "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0", // sETH.SEPOLIA
    "0x1de70f3e971B62A0707dA18100392af14f7fB677", // ETH.ARBSEP
    "0x236b0DE675cC8F46AE186897fCCeFe3370C9eDeD", // ETH.BASESEPOLIA
    "0xcC683A782f4B30c138787CB5576a86AF66fdc31d", // USDC.SEPOLIA
    "0x4bC32034caCcc9B7e02536945eDbC286bACbA073", // USDC.ARBSEP
    "0xe573a6e11f8506620F123DBF930222163D46BCB6", // USDC.AMOY
    "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891", // BNB.BSC
    "0xEe9CC614D03e7Dbe994b514079f4914a605B4719", // AVAX.FUJI
    "0x777915D031d1e8144c90D025C594b3b8Bf07a08d", // POL.AMOY
  ];
  
  console.log(`\nAdding support for ${tokensToSupport.length} tokens...`);
  
  for (let i = 0; i < tokensToSupport.length; i++) {
    const tokenAddress = tokensToSupport[i];
    
    try {
      // Check if already supported
      const isSupported = await executor.supportedTokens(tokenAddress);
      
      if (isSupported) {
        console.log(`✅ Token ${tokenAddress} already supported`);
        continue;
      }
      
      console.log(`📝 Adding support for token ${i + 1}/${tokensToSupport.length}: ${tokenAddress}`);
      
      const tx = await executor.setTokenSupport(tokenAddress, true);
      await tx.wait();
      
      console.log(`✅ Token support added: ${tx.hash}`);
      
      // Wait between transactions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to add support for ${tokenAddress}:`, error.message);
    }
  }
  
  console.log("\n🎉 Token setup complete!");
  
  // Verify setup
  console.log("\n📋 Verifying token support...");
  for (const tokenAddress of tokensToSupport) {
    const isSupported = await executor.supportedTokens(tokenAddress);
    console.log(`${tokenAddress}: ${isSupported ? '✅ Supported' : '❌ Not supported'}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });