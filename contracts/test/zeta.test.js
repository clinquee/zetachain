const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZetaNFT & ZetaVaultExecutor", function () {
  let nft, executor, testToken;
  let owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy TestToken
    const TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy();
    await testToken.waitForDeployment();

    // Deploy ZetaNFT
    const NFT = await ethers.getContractFactory("ZetaNFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    // Deploy ZetaVaultExecutor
    const Executor = await ethers.getContractFactory("ZetaVaultExecutor");
    executor = await Executor.deploy(await nft.getAddress());
    await executor.waitForDeployment();

    // Transfer NFT ownership to executor
    await nft.transferOwnership(await executor.getAddress());

    // Mint test tokens to users
    await testToken.mint(user1.address, ethers.parseEther("100"));
    await testToken.mint(user2.address, ethers.parseEther("100"));
  });

  it("should mint NFT via executor", async () => {
    const action = {
      actionType: "mintNFT",
      recipient: user1.address,
      amount: 0,
      tokenAddress: await nft.getAddress(),
      targetChainId: 0,
      metadataURI: "ipfs://example-uri",
      tokenId: 0,
    };

    await executor.connect(owner).executeActions([action]);

    expect(await nft.ownerOf(0)).to.equal(user1.address);
    expect(await nft.tokenURI(0)).to.equal("ipfs://example-uri");
  });

  it("should transfer tokens via executor", async () => {
    const amount = ethers.parseEther("10");

    // Approve executor to spend tokens
    await testToken.connect(user1).approve(await executor.getAddress(), amount);

    const action = {
      actionType: "transfer",
      recipient: user2.address,
      amount,
      tokenAddress: await testToken.getAddress(),
      targetChainId: 0,
      metadataURI: "",
      tokenId: 0,
    };

    const initialBalance = await testToken.balanceOf(user2.address);
    await executor.connect(user1).executeActions([action]);
    const finalBalance = await testToken.balanceOf(user2.address);

    expect(finalBalance - initialBalance).to.equal(amount);
  });

  it("should deposit and withdraw tokens via executor", async () => {
    const amount = ethers.parseEther("5");

    // Approve executor to spend tokens
    await testToken.connect(user1).approve(await executor.getAddress(), amount);

    const depositAction = {
      actionType: "deposit",
      recipient: ethers.ZeroAddress,
      amount,
      tokenAddress: await testToken.getAddress(),
      targetChainId: 0,
      metadataURI: "",
      tokenId: 0,
    };

    const withdrawAction = {
      actionType: "withdraw",
      recipient: ethers.ZeroAddress,
      amount,
      tokenAddress: await testToken.getAddress(),
      targetChainId: 0,
      metadataURI: "",
      tokenId: 0,
    };

    // Test deposit
    await executor.connect(user1).executeActions([depositAction]);
    expect(await executor.userBalances(user1.address, await testToken.getAddress())).to.equal(amount);

    // Test withdraw
    await executor.connect(user1).executeActions([withdrawAction]);
    expect(await executor.userBalances(user1.address, await testToken.getAddress())).to.equal(0);
  });

  it("should mint and transfer NFT", async () => {
    const mintAction = {
      actionType: "mintNFT",
      recipient: user1.address,
      amount: 0,
      tokenAddress: await nft.getAddress(),
      targetChainId: 0,
      metadataURI: "ipfs://token1",
      tokenId: 1,
    };

    // Mint NFT
    await executor.connect(owner).executeActions([mintAction]);
    expect(await nft.ownerOf(0)).to.equal(user1.address);

    // Approve executor to transfer NFT
    await nft.connect(user1).approve(await executor.getAddress(), 0);

    const transferNFTAction = {
      actionType: "transferNFT",
      recipient: user2.address,
      amount: 0,
      tokenAddress: await nft.getAddress(),
      targetChainId: 0,
      metadataURI: "",
      tokenId: 0,
    };

    // Transfer NFT
    await executor.connect(user1).executeActions([transferNFTAction]);
    expect(await nft.ownerOf(0)).to.equal(user2.address);
  });

  it("should fail withdraw if insufficient balance", async () => {
    const action = {
      actionType: "withdraw",
      recipient: ethers.ZeroAddress,
      amount: ethers.parseEther("999"),
      tokenAddress: await testToken.getAddress(),
      targetChainId: 0,
      metadataURI: "",
      tokenId: 0,
    };

    await expect(executor.connect(user1).executeActions([action])).to.be.revertedWith("Insufficient balance");
  });
});