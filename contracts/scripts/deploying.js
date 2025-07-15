const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying ZetaVault system with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // ZetaChain testnet Gateway address
  const GATEWAY_ADDRESS = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";

  // Deploy ZetaNFT
  console.log("\nDeploying ZetaNFT...");
  const ZetaNFT = await ethers.getContractFactory("ZetaNFT");
  const zetaNFT = await ZetaNFT.deploy();
  await zetaNFT.waitForDeployment();
  const zetaNFTAddress = await zetaNFT.getAddress();
  console.log("ZetaNFT deployed to:", zetaNFTAddress);

  // Deploy ZetaVaultExecutor
  console.log("\nDeploying ZetaVaultExecutor...");
  const ZetaVaultExecutor = await ethers.getContractFactory("ZetaVaultExecutor");
  const executor = await ZetaVaultExecutor.deploy(zetaNFTAddress, GATEWAY_ADDRESS);
  await executor.waitForDeployment();
  const executorAddress = await executor.getAddress();
  console.log("ZetaVaultExecutor deployed to:", executorAddress);

  // Transfer NFT ownership to executor
  console.log("\nTransferring ZetaNFT ownership to ZetaVaultExecutor...");
  await zetaNFT.transferOwnership(executorAddress);
  console.log("Ownership transferred successfully");

  // Set up supported tokens (ZetaChain testnet ZRC20 addresses)
  console.log("\nSetting up supported tokens...");
  const supportedTokens = [
    // Major cryptocurrencies
    "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891", // BNB.BSC
    "0xEe9CC614D03e7Dbe994b514079f4914a605B4719", // AVAX.FUJI
    "0xADF73ebA3Ebaa7254E859549A44c74eF7cff7501", // SOL.SOLANA
    "0x777915D031d1e8144c90D025C594b3b8Bf07a08d", // POL.AMOY
    "0x3e128c169564DD527C8e9bd85124BF6A890E5a5f", // SUI.SUI
    "0x54Bf2B1E91FCb56853097BD2545750d218E245e1", // TON.TON
    
    // Bitcoin variants
    "0xdbfF6471a79E5374d771922F2194eccc42210B9F", // sBTC.BTC
    "0xfC9201f4116aE6b054722E10b98D904829b469c3", // tBTC.BTC
    
    // Ethereum variants
    "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0", // sETH.SEPOLIA
    "0x1de70f3e971B62A0707dA18100392af14f7fB677", // ETH.ARBSEP
    "0x236b0DE675cC8F46AE186897fCCeFe3370C9eDeD", // ETH.BASESEPOLIA
    
    // USDC variants
    "0xcC683A782f4B30c138787CB5576a86AF66fdc31d", // USDC.SEPOLIA
    "0x4bC32034caCcc9B7e02536945eDbC286bACbA073", // USDC.ARBSEP
    "0x7c8dDa80bbBE1254a7aACf3219EBe1481c6E01d7", // USDC.BSC
    "0x8344d6f84d26f998fa070BbEA6D2E15E359e2641", // USDC.FUJI
    "0xe573a6e11f8506620F123DBF930222163D46BCB6", // USDC.AMOY
    "0xE80e3e8Ac1C19c744d4c2147172489BEAF23E3C5", // USDC.SUI
    "0xD10932EB3616a937bd4a2652c87E9FeBbAce53e5", // USDC.SOL
  ];

  for (const token of supportedTokens) {
    try {
      await executor.setTokenSupport(token, true);
      console.log(`✓ Added support for token: ${token}`);
    } catch (error) {
      console.log(`✗ Failed to add support for token ${token}:`, error.message);
    }
  }

  // Verify deployments
  console.log("\n=== ZetaVault Deployment Summary ===");
  console.log("ZetaNFT:", zetaNFTAddress);
  console.log("ZetaVaultExecutor:", executorAddress);
  console.log("Gateway:", GATEWAY_ADDRESS);
  console.log("ZetaNFT Owner:", await zetaNFT.owner());
  console.log("Executor Owner:", await executor.owner());
  console.log("Fee Recipient:", await executor.feeRecipient());
  console.log("Deployer:", deployer.address);
  console.log("Supported Tokens Count:", supportedTokens.length);

  // Save deployment info to file
  const deploymentInfo = {
    network: "zetachain-testnet",
    chainId: 7001,
    contracts: {
      ZetaNFT: zetaNFTAddress,
      ZetaVaultExecutor: executorAddress,
      Gateway: GATEWAY_ADDRESS
    },
    supportedTokens: {
      addresses: supportedTokens,
      details: {
        "BNB.BSC": "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891",
        "AVAX.FUJI": "0xEe9CC614D03e7Dbe994b514079f4914a605B4719",
        "SOL.SOLANA": "0xADF73ebA3Ebaa7254E859549A44c74eF7cff7501",
        "POL.AMOY": "0x777915D031d1e8144c90D025C594b3b8Bf07a08d",
        "SUI.SUI": "0x3e128c169564DD527C8e9bd85124BF6A890E5a5f",
        "TON.TON": "0x54Bf2B1E91FCb56853097BD2545750d218E245e1",
        "sBTC.BTC": "0xdbfF6471a79E5374d771922F2194eccc42210B9F",
        "tBTC.BTC": "0xfC9201f4116aE6b054722E10b98D904829b469c3",
        "sETH.SEPOLIA": "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0",
        "ETH.ARBSEP": "0x1de70f3e971B62A0707dA18100392af14f7fB677",
        "ETH.BASESEPOLIA": "0x236b0DE675cC8F46AE186897fCCeFe3370C9eDeD",
        "USDC.SEPOLIA": "0xcC683A782f4B30c138787CB5576a86AF66fdc31d",
        "USDC.ARBSEP": "0x4bC32034caCcc9B7e02536945eDbC286bACbA073",
        "USDC.BSC": "0x7c8dDa80bbBE1254a7aACf3219EBe1481c6E01d7",
        "USDC.FUJI": "0x8344d6f84d26f998fa070BbEA6D2E15E359e2641",
        "USDC.AMOY": "0xe573a6e11f8506620F123DBF930222163D46BCB6",
        "USDC.SUI": "0xE80e3e8Ac1C19c744d4c2147172489BEAF23E3C5",
        "USDC.SOL": "0xD10932EB3616a937bd4a2652c87E9FeBbAce53e5"
      }
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  const fs = require('fs');
  fs.writeFileSync(
    './deployments.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployments.json");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nYour ZetaVault now supports cross-chain operations with:");
  console.log("• Major cryptocurrencies (BNB, AVAX, SOL, POL, SUI, TON)");
  console.log("• Bitcoin variants (sBTC, tBTC)");
  console.log("• Ethereum from multiple chains (Sepolia, Arbitrum, Base)");
  console.log("• USDC from 7 different chains");
  console.log("\nNext steps:");
  console.log("1. Verify contracts on ZetaChain explorer");
  console.log("2. Test NFT minting and token operations");
  console.log("3. Test cross-chain functionality with any supported token");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });