const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

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

  // Deploy ZetaVaultExecutor
  console.log("\nDeploying ZetaVaultExecutor...");
  const ZetaVaultExecutor = await ethers.getContractFactory("ZetaVaultExecutor");
  const executor = await ZetaVaultExecutor.deploy(await zetaNFT.getAddress());
  await executor.waitForDeployment();
  console.log("ZetaVaultExecutor deployed to:", await executor.getAddress());

  // Transfer NFT ownership to executor
  console.log("\nTransferring ZetaNFT ownership to ZetaVaultExecutor...");
  await zetaNFT.transferOwnership(await executor.getAddress());
  console.log("Ownership transferred successfully");

  // Verify deployments
  console.log("\n=== Deployment Summary ===");
  console.log("TestToken:", await testToken.getAddress());
  console.log("ZetaNFT:", await zetaNFT.getAddress());
  console.log("ZetaVaultExecutor:", await executor.getAddress());
  console.log("ZetaNFT Owner:", await zetaNFT.owner());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });