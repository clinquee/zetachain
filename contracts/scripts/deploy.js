const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // ZetaChain testnet Gateway address (you'll need to get the correct one)
  const ZETA_GATEWAY_ADDRESS = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";

  // Deploy MockGateway for testing (optional - use real gateway in production)
  console.log("\nDeploying MockGateway for testing...");
  const MockGateway = await ethers.getContractFactory("MockGateway");
  const mockGateway = await MockGateway.deploy();
  await mockGateway.waitForDeployment();
  console.log("MockGateway deployed to:", await mockGateway.getAddress());

  // Deploy TestToken (optional for local testing)
  console.log("\nDeploying TestToken...");
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();
  await testToken.waitForDeployment();
  console.log("TestToken deployed to:", await testToken.getAddress());

  // Deploy ZetaNFT
  console.log("\nDeploying ZetaNFT...");
  const ZetaNFT = await ethers.getContractFactory("ZetaNFT");
  const zetaNFT = await ZetaNFT.deploy();
  await zetaNFT.waitForDeployment();
  console.log("ZetaNFT deployed to:", await zetaNFT.getAddress());

  // Deploy ZetaVaultExecutor with both required parameters
  console.log("\nDeploying ZetaVaultExecutor...");
  const ZetaVaultExecutor = await ethers.getContractFactory("ZetaVaultExecutor");
  const executor = await ZetaVaultExecutor.deploy(
    await zetaNFT.getAddress(),
    await mockGateway.getAddress() // Use mockGateway.getAddress() for testing or ZETA_GATEWAY_ADDRESS for production
  );
  await executor.waitForDeployment();
  console.log("ZetaVaultExecutor deployed to:", await executor.getAddress());

  // Transfer NFT ownership to executor
  console.log("\nTransferring ZetaNFT ownership to ZetaVaultExecutor...");
  await zetaNFT.transferOwnership(await executor.getAddress());
  console.log("Ownership transferred successfully");

  // Set up some test tokens (optional)
  console.log("\nSetting up TestToken support...");
  await executor.setTokenSupport(await testToken.getAddress(), true);
  console.log("TestToken support enabled");

  // Verify deployments
  console.log("\n=== Deployment Summary ===");
  console.log("TestToken:", await testToken.getAddress());
  console.log("MockGateway:", await mockGateway.getAddress());
  console.log("ZetaNFT:", await zetaNFT.getAddress());
  console.log("ZetaVaultExecutor:", await executor.getAddress());
  console.log("ZetaNFT Owner:", await zetaNFT.owner());
  console.log("Executor Owner:", await executor.owner());
  console.log("Fee Recipient:", await executor.feeRecipient());

  // Save deployment addresses to a file
  const deploymentInfo = {
    network: "zetachain_testnet",
    chainId: 7001,
    deployer: deployer.address,
    contracts: {
      TestToken: await testToken.getAddress(),
      MockGateway: await mockGateway.getAddress(),
      ZetaNFT: await zetaNFT.getAddress(),
      ZetaVaultExecutor: await executor.getAddress()
    },
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    './deployments.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);

  });