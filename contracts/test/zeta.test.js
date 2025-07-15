const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZetaVault System - Comprehensive Tests", function () {
  let zetaNFT, executor, mockGateway, mockZRC20, mockZRC20_2;
  let owner, user1, user2, user3, feeRecipient;
  
  const CHAIN_ID_1 = 1;
  const CHAIN_ID_2 = 2;
  const DEFAULT_METADATA_URI = "ipfs://QmTest123";

  beforeEach(async () => {
    [owner, user1, user2, user3, feeRecipient] = await ethers.getSigners();

    // Deploy mock ZRC20 tokens
    const MockZRC20 = await ethers.getContractFactory("MockZRC20");
    mockZRC20 = await MockZRC20.deploy("Test Token", "TEST", 18, CHAIN_ID_1, 1);
    await mockZRC20.waitForDeployment();

    mockZRC20_2 = await MockZRC20.deploy("Test Token 2", "TEST2", 6, CHAIN_ID_2, 2);
    await mockZRC20_2.waitForDeployment();

    // Deploy mock Gateway
    const MockGateway = await ethers.getContractFactory("MockGateway");
    mockGateway = await MockGateway.deploy();
    await mockGateway.waitForDeployment();

    // Deploy ZetaNFT
    const ZetaNFT = await ethers.getContractFactory("ZetaNFT");
    zetaNFT = await ZetaNFT.deploy();
    await zetaNFT.waitForDeployment();

    // Deploy ZetaVaultExecutor
    const ZetaVaultExecutor = await ethers.getContractFactory("ZetaVaultExecutor");
    executor = await ZetaVaultExecutor.deploy(
      await zetaNFT.getAddress(),
      await mockGateway.getAddress()
    );
    await executor.waitForDeployment();

    // Transfer NFT ownership to executor
    await zetaNFT.transferOwnership(await executor.getAddress());

    // Set up tokens and mint test tokens
    await executor.setTokenSupport(await mockZRC20.getAddress(), true);
    await executor.setTokenSupport(await mockZRC20_2.getAddress(), true);
    
    await mockZRC20.mint(user1.address, ethers.parseEther("10000"));
    await mockZRC20.mint(user2.address, ethers.parseEther("10000"));
    await mockZRC20.mint(user3.address, ethers.parseEther("10000"));
    
    await mockZRC20_2.mint(user1.address, ethers.parseUnits("10000", 6));
    await mockZRC20_2.mint(user2.address, ethers.parseUnits("10000", 6));
  });

  describe("Contract Deployment", function () {
    it("should deploy all contracts correctly", async () => {
      expect(await zetaNFT.name()).to.equal("ZetaNFT");
      expect(await zetaNFT.symbol()).to.equal("ZNFT");
      expect(await zetaNFT.owner()).to.equal(await executor.getAddress());
      expect(await executor.owner()).to.equal(owner.address);
      expect(await executor.zetaNFT()).to.equal(await zetaNFT.getAddress());
      expect(await executor.gateway()).to.equal(await mockGateway.getAddress());
    });

    it("should set initial values correctly", async () => {
      expect(await executor.FEE_BASIS_POINTS()).to.equal(10);
      expect(await executor.MAX_FEE_BASIS_POINTS()).to.equal(1000);
      expect(await executor.feeRecipient()).to.equal(owner.address);
      expect(await zetaNFT.getCurrentTokenId()).to.equal(0);
      expect(await zetaNFT.getTotalMinted()).to.equal(0);
    });

    it("should revert on invalid constructor parameters", async () => {
      const ZetaVaultExecutor = await ethers.getContractFactory("ZetaVaultExecutor");
      
      await expect(
        ZetaVaultExecutor.deploy(ethers.ZeroAddress, await mockGateway.getAddress())
      ).to.be.revertedWith("Invalid ZetaNFT address");

      await expect(
        ZetaVaultExecutor.deploy(await zetaNFT.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid Gateway address");
    });
  });

  describe("NFT Operations", function () {
    describe("Single NFT Minting", function () {
      it("should mint NFT successfully via executor", async () => {
        const action = {
          actionType: "mintNFT",
          recipient: user1.address,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: DEFAULT_METADATA_URI,
          tokenId: 0,
        };

        const network = await ethers.provider.getNetwork();
        const chainId = Number(network.chainId);

        await expect(executor.executeActions([action]))
          .to.emit(zetaNFT, "NFTMinted")
          .withArgs(user1.address, 0, DEFAULT_METADATA_URI, chainId)
          .to.emit(executor, "ActionExecuted");

        expect(await zetaNFT.ownerOf(0)).to.equal(user1.address);
        expect(await zetaNFT.tokenURI(0)).to.equal(DEFAULT_METADATA_URI);
        expect(await zetaNFT.getTotalMinted()).to.equal(1);
        expect(await zetaNFT.getTokenChainOrigin(0)).to.equal(chainId);
      });

      it("should mint multiple NFTs sequentially", async () => {
        const actions = [
          {
            actionType: "mintNFT",
            recipient: user1.address,
            amount: 0,
            tokenAddress: ethers.ZeroAddress,
            targetChainId: 0,
            metadataURI: "ipfs://QmToken1",
            tokenId: 0,
          },
          {
            actionType: "mintNFT",
            recipient: user2.address,
            amount: 0,
            tokenAddress: ethers.ZeroAddress,
            targetChainId: 0,
            metadataURI: "ipfs://QmToken2",
            tokenId: 0,
          }
        ];

        await executor.executeActions(actions);

        expect(await zetaNFT.ownerOf(0)).to.equal(user1.address);
        expect(await zetaNFT.ownerOf(1)).to.equal(user2.address);
        expect(await zetaNFT.getTotalMinted()).to.equal(2);
      });

      it("should revert when minting to zero address", async () => {
        const action = {
          actionType: "mintNFT",
          recipient: ethers.ZeroAddress,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: DEFAULT_METADATA_URI,
          tokenId: 0,
        };

        await expect(executor.executeActions([action]))
          .to.be.revertedWith("Invalid recipient");
      });

      it("should revert when minting with empty metadata URI", async () => {
        const action = {
          actionType: "mintNFT",
          recipient: user1.address,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };

        await expect(executor.executeActions([action]))
          .to.be.revertedWith("Empty metadata URI");
      });

      it("should get all tokens owned by address", async () => {
        // Mint multiple NFTs to user1
        for (let i = 0; i < 3; i++) {
          const action = {
            actionType: "mintNFT",
            recipient: user1.address,
            amount: 0,
            tokenAddress: ethers.ZeroAddress,
            targetChainId: 0,
            metadataURI: `ipfs://QmToken${i}`,
            tokenId: 0,
          };
          await executor.executeActions([action]);
        }
        
        const tokens = await zetaNFT.getTokensOfOwner(user1.address);
        expect(tokens.length).to.equal(3);
        expect(tokens[0]).to.equal(0);
        expect(tokens[1]).to.equal(1);
        expect(tokens[2]).to.equal(2);
      });
    });

    describe("NFT Transfers", function () {
      beforeEach(async () => {
        const action = {
          actionType: "mintNFT",
          recipient: user1.address,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: DEFAULT_METADATA_URI,
          tokenId: 0,
        };
        await executor.executeActions([action]);
      });

      it("should transfer NFT within same chain via executor", async () => {
        const action = {
          actionType: "transferNFT",
          recipient: user2.address,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };

        await expect(executor.connect(user1).executeActions([action]))
          .to.emit(zetaNFT, "NFTTransferredSameChain")
          .withArgs(user1.address, user2.address, 0)
          .to.emit(executor, "NFTTransferred");

        expect(await zetaNFT.ownerOf(0)).to.equal(user2.address);
      });

      it("should transfer NFT with approval", async () => {
        await zetaNFT.connect(user1).approve(user2.address, 0);
        
        await zetaNFT.connect(user2).transferNFTSameChain(user1.address, user3.address, 0);
        expect(await zetaNFT.ownerOf(0)).to.equal(user3.address);
      });

      it("should transfer NFT with setApprovalForAll", async () => {
        await zetaNFT.connect(user1).setApprovalForAll(user2.address, true);
        
        await zetaNFT.connect(user2).transferNFTSameChain(user1.address, user3.address, 0);
        expect(await zetaNFT.ownerOf(0)).to.equal(user3.address);
      });

      it("should revert transfer to zero address", async () => {
        await expect(
          zetaNFT.connect(user1).transferNFTSameChain(user1.address, ethers.ZeroAddress, 0)
        ).to.be.revertedWith("Cannot transfer to zero address");
      });

      it("should revert unauthorized transfer", async () => {
        const action = {
          actionType: "transferNFT",
          recipient: user2.address,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };

        await expect(executor.connect(user2).executeActions([action]))
          .to.be.revertedWith("Not token owner");
      });

      it("should revert transfer to self", async () => {
        await expect(
          zetaNFT.connect(user1).transferNFTSameChain(user1.address, user1.address, 0)
        ).to.be.revertedWith("Cannot transfer to self");
      });
    });

    describe("NFT Metadata", function () {
      beforeEach(async () => {
        const action = {
          actionType: "mintNFT",
          recipient: user1.address,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: DEFAULT_METADATA_URI,
          tokenId: 0,
        };
        await executor.executeActions([action]);
      });

      it("should update metadata", async () => {
        const newURI = "ipfs://QmNewMetadata";
        
        await expect(zetaNFT.updateMetadata(0, newURI))
          .to.emit(zetaNFT, "MetadataUpdated")
          .withArgs(0, newURI);

        expect(await zetaNFT.tokenURI(0)).to.equal(newURI);
        expect(await zetaNFT.getTokenMetadata(0)).to.equal(newURI);
      });

      it("should check if token exists", async () => {
        expect(await zetaNFT.exists(0)).to.be.true;
        expect(await zetaNFT.exists(999)).to.be.false;
      });

      it("should revert metadata update for non-existent token", async () => {
        await expect(zetaNFT.updateMetadata(999, "ipfs://new"))
          .to.be.revertedWith("Token does not exist");
      });

      it("should revert metadata update with empty URI", async () => {
        await expect(zetaNFT.updateMetadata(0, ""))
          .to.be.revertedWith("Metadata URI cannot be empty");
      });
    });
  });

  describe("Token Operations", function () {
    describe("Token Deposits", function () {
      it("should deposit tokens successfully", async () => {
        const amount = ethers.parseEther("100");
        const expectedFee = (amount * BigInt(10)) / BigInt(10000); // 0.1% fee
        const expectedNet = amount - expectedFee;

        await mockZRC20.connect(user1).approve(await executor.getAddress(), amount);

        const action = {
          actionType: "deposit",
          recipient: ethers.ZeroAddress,
          amount,
          tokenAddress: await mockZRC20.getAddress(),
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };

        await expect(executor.connect(user1).executeActions([action]))
          .to.emit(executor, "TokensDeposited")
          .withArgs(user1.address, await mockZRC20.getAddress(), expectedNet);

        expect(await executor.getUserBalance(user1.address, await mockZRC20.getAddress()))
          .to.equal(expectedNet);
      });

      it("should revert deposit of unsupported token", async () => {
        const TestToken = await ethers.getContractFactory("TestToken");
        const unsupportedToken = await TestToken.deploy();
        await unsupportedToken.waitForDeployment();

        const amount = ethers.parseEther("100");
        await unsupportedToken.mint(user1.address, amount);
        await unsupportedToken.connect(user1).approve(await executor.getAddress(), amount);

        const action = {
          actionType: "deposit",
          recipient: ethers.ZeroAddress,
          amount,
          tokenAddress: await unsupportedToken.getAddress(),
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };

        await expect(executor.connect(user1).executeActions([action]))
          .to.be.revertedWith("Token not supported");
      });

      it("should revert deposit with zero amount", async () => {
        const action = {
          actionType: "deposit",
          recipient: ethers.ZeroAddress,
          amount: 0,
          tokenAddress: await mockZRC20.getAddress(),
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };

        await expect(executor.connect(user1).executeActions([action]))
          .to.be.revertedWith("Invalid amount");
      });
    });

    describe("Token Withdrawals", function () {
      beforeEach(async () => {
        const amount = ethers.parseEther("100");
        await mockZRC20.connect(user1).approve(await executor.getAddress(), amount);
        
        const depositAction = {
          actionType: "deposit",
          recipient: ethers.ZeroAddress,
          amount,
          tokenAddress: await mockZRC20.getAddress(),
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };
        
        await executor.connect(user1).executeActions([depositAction]);
      });

      it("should withdraw tokens successfully", async () => {
        const userBalance = await executor.getUserBalance(user1.address, await mockZRC20.getAddress());
        
        const action = {
          actionType: "withdraw",
          recipient: ethers.ZeroAddress,
          amount: userBalance,
          tokenAddress: await mockZRC20.getAddress(),
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };

        await expect(executor.connect(user1).executeActions([action]))
          .to.emit(executor, "TokensWithdrawn")
          .withArgs(user1.address, await mockZRC20.getAddress(), userBalance);

        expect(await executor.getUserBalance(user1.address, await mockZRC20.getAddress()))
          .to.equal(0);
      });

      it("should revert withdrawal with insufficient balance", async () => {
        const userBalance = await executor.getUserBalance(user1.address, await mockZRC20.getAddress());
        const excessiveAmount = userBalance + ethers.parseEther("1");

        const action = {
          actionType: "withdraw",
          recipient: ethers.ZeroAddress,
          amount: excessiveAmount,
          tokenAddress: await mockZRC20.getAddress(),
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };

        await expect(executor.connect(user1).executeActions([action]))
          .to.be.revertedWith("Insufficient balance");
      });
    });

    describe("Token Transfers", function () {
      it("should transfer tokens between users", async () => {
        const amount = ethers.parseEther("50");
        await mockZRC20.connect(user1).approve(await executor.getAddress(), amount);

        const action = {
          actionType: "transfer",
          recipient: user2.address,
          amount,
          tokenAddress: await mockZRC20.getAddress(),
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };

        const initialBalance = await mockZRC20.balanceOf(user2.address);
        await executor.connect(user1).executeActions([action]);
        const finalBalance = await mockZRC20.balanceOf(user2.address);

        expect(finalBalance - initialBalance).to.equal(amount);
      });

      it("should revert transfer to zero address", async () => {
        const amount = ethers.parseEther("50");
        await mockZRC20.connect(user1).approve(await executor.getAddress(), amount);

        const action = {
          actionType: "transfer",
          recipient: ethers.ZeroAddress,
          amount,
          tokenAddress: await mockZRC20.getAddress(),
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        };

        await expect(executor.connect(user1).executeActions([action]))
          .to.be.revertedWith("Invalid recipient");
      });
    });

    describe("Multiple Token Types", function () {
      it("should handle multiple token types", async () => {
        const amount1 = ethers.parseEther("100");
        const amount2 = ethers.parseUnits("100", 6);

        // Deposit both tokens
        await mockZRC20.connect(user1).approve(await executor.getAddress(), amount1);
        await mockZRC20_2.connect(user1).approve(await executor.getAddress(), amount2);

        const actions = [
          {
            actionType: "deposit",
            recipient: ethers.ZeroAddress,
            amount: amount1,
            tokenAddress: await mockZRC20.getAddress(),
            targetChainId: 0,
            metadataURI: "",
            tokenId: 0,
          },
          {
            actionType: "deposit",
            recipient: ethers.ZeroAddress,
            amount: amount2,
            tokenAddress: await mockZRC20_2.getAddress(),
            targetChainId: 0,
            metadataURI: "",
            tokenId: 0,
          }
        ];

        await executor.connect(user1).executeActions(actions);

        const balances = await executor.getUserBalances(
          user1.address,
          [await mockZRC20.getAddress(), await mockZRC20_2.getAddress()]
        );

        expect(balances.length).to.equal(2);
        expect(balances[0]).to.be.gt(0);
        expect(balances[1]).to.be.gt(0);
      });
    });
  });

  describe("Cross-Chain Operations", function () {
    beforeEach(async () => {
      const amount = ethers.parseEther("100");
      await mockZRC20.connect(user1).approve(await executor.getAddress(), amount);
      
      const depositAction = {
        actionType: "deposit",
        recipient: ethers.ZeroAddress,
        amount,
        tokenAddress: await mockZRC20.getAddress(),
        targetChainId: 0,
        metadataURI: "",
        tokenId: 0,
      };
      
      await executor.connect(user1).executeActions([depositAction]);
    });

    it("should initiate cross-chain transfer", async () => {
      const userBalance = await executor.getUserBalance(user1.address, await mockZRC20.getAddress());
      
      const action = {
        actionType: "crossChainTransfer",
        recipient: user2.address,
        amount: userBalance,
        tokenAddress: await mockZRC20.getAddress(),
        targetChainId: CHAIN_ID_2,
        metadataURI: "",
        tokenId: 0,
      };

      await expect(executor.connect(user1).executeActions([action]))
        .to.emit(executor, "CrossChainTransferInitiated")
        .to.emit(mockGateway, "WithdrawCalled");

      expect(await executor.getUserBalance(user1.address, await mockZRC20.getAddress()))
        .to.equal(0);
    });

    it("should handle bridge action type", async () => {
      const userBalance = await executor.getUserBalance(user1.address, await mockZRC20.getAddress());
      
      const action = {
        actionType: "bridge",
        recipient: user2.address,
        amount: userBalance,
        tokenAddress: await mockZRC20.getAddress(),
        targetChainId: CHAIN_ID_2,
        metadataURI: "",
        tokenId: 0,
      };

      await expect(executor.connect(user1).executeActions([action]))
        .to.emit(executor, "CrossChainTransferInitiated");
    });

    it("should revert cross-chain transfer to same chain", async () => {
      const userBalance = await executor.getUserBalance(user1.address, await mockZRC20.getAddress());
      const currentChainId = await ethers.provider.getNetwork().then(n => n.chainId);
      
      const action = {
        actionType: "crossChainTransfer",
        recipient: user2.address,
        amount: userBalance,
        tokenAddress: await mockZRC20.getAddress(),
        targetChainId: Number(currentChainId),
        metadataURI: "",
        tokenId: 0,
      };

      await expect(executor.connect(user1).executeActions([action]))
        .to.be.revertedWith("Cannot transfer to same chain");
    });

    it("should revert cross-chain transfer with insufficient balance", async () => {
      const userBalance = await executor.getUserBalance(user1.address, await mockZRC20.getAddress());
      const excessiveAmount = userBalance + ethers.parseEther("1");
      
      const action = {
        actionType: "crossChainTransfer",
        recipient: user2.address,
        amount: excessiveAmount,
        tokenAddress: await mockZRC20.getAddress(),
        targetChainId: CHAIN_ID_2,
        metadataURI: "",
        tokenId: 0,
      };

      await expect(executor.connect(user1).executeActions([action]))
        .to.be.revertedWith("Insufficient balance");
    });

    it("should handle duplicate transaction scenarios correctly", async () => {
      const userBalance = await executor.getUserBalance(user1.address, await mockZRC20.getAddress());
      
      const action1 = {
        actionType: "crossChainTransfer",
        recipient: user2.address,
        amount: userBalance / 2n,
        tokenAddress: await mockZRC20.getAddress(),
        targetChainId: CHAIN_ID_2,
        metadataURI: "",
        tokenId: 0,
      };

      // Execute first transaction
      await executor.connect(user1).executeActions([action1]);

      // Execute a different transaction (should work)
      const action2 = {
        actionType: "crossChainTransfer",
        recipient: user2.address,
        amount: userBalance / 2n,
        tokenAddress: await mockZRC20.getAddress(),
        targetChainId: CHAIN_ID_2,
        metadataURI: "different", // Different metadata to make hash different
        tokenId: 0,
      };

      await expect(executor.connect(user1).executeActions([action2]))
        .to.emit(executor, "CrossChainTransferInitiated");
    });

    it("should handle gateway failures", async () => {
      await mockGateway.setShouldRevert(true, "Gateway failure");
      
      const userBalance = await executor.getUserBalance(user1.address, await mockZRC20.getAddress());
      
      const action = {
        actionType: "crossChainTransfer",
        recipient: user2.address,
        amount: userBalance,
        tokenAddress: await mockZRC20.getAddress(),
        targetChainId: CHAIN_ID_2,
        metadataURI: "",
        tokenId: 0,
      };

      await expect(executor.connect(user1).executeActions([action]))
        .to.be.revertedWith("Gateway failure");
    });
  });

  describe("Batch Operations", function () {
    it("should execute multiple actions in one transaction", async () => {
      const amount = ethers.parseEther("100");
      await mockZRC20.connect(user1).approve(await executor.getAddress(), amount);

      const actions = [
        {
          actionType: "mintNFT",
          recipient: user1.address,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: DEFAULT_METADATA_URI,
          tokenId: 0,
        },
        {
          actionType: "deposit",
          recipient: ethers.ZeroAddress,
          amount,
          tokenAddress: await mockZRC20.getAddress(),
          targetChainId: 0,
          metadataURI: "",
          tokenId: 0,
        }
      ];

      await expect(executor.connect(user1).executeActions(actions))
        .to.emit(zetaNFT, "NFTMinted")
        .to.emit(executor, "TokensDeposited");

      expect(await zetaNFT.ownerOf(0)).to.equal(user1.address);
      expect(await executor.getUserBalance(user1.address, await mockZRC20.getAddress()))
        .to.be.gt(0);
    });

    it("should revert with too many actions", async () => {
      const actions = new Array(11).fill({
        actionType: "mintNFT",
        recipient: user1.address,
        amount: 0,
        tokenAddress: ethers.ZeroAddress,
        targetChainId: 0,
        metadataURI: DEFAULT_METADATA_URI,
        tokenId: 0,
      });

      await expect(executor.executeActions(actions))
        .to.be.revertedWith("Too many actions");
    });

    it("should revert with no actions", async () => {
      await expect(executor.executeActions([]))
        .to.be.revertedWith("No actions provided");
    });

    it("should revert with invalid action type", async () => {
      const action = {
        actionType: "invalidAction",
        recipient: user1.address,
        amount: 0,
        tokenAddress: await mockZRC20.getAddress(),
        targetChainId: 0,
        metadataURI: "",
        tokenId: 0,
      };

      await expect(executor.executeActions([action]))
        .to.be.revertedWith("Invalid action type");
    });
  });

  describe("Admin Functions", function () {
    describe("Token Support Management", function () {
      it("should add and remove token support", async () => {
        const TestToken = await ethers.getContractFactory("TestToken");
        const newToken = await TestToken.deploy();
        await newToken.waitForDeployment();

        await expect(executor.setTokenSupport(await newToken.getAddress(), true))
          .to.emit(executor, "TokenSupportUpdated")
          .withArgs(await newToken.getAddress(), true);

        expect(await executor.supportedTokens(await newToken.getAddress())).to.be.true;

        await expect(executor.setTokenSupport(await newToken.getAddress(), false))
          .to.emit(executor, "TokenSupportUpdated")
          .withArgs(await newToken.getAddress(), false);

        expect(await executor.supportedTokens(await newToken.getAddress())).to.be.false;
      });

      it("should revert token support from non-owner", async () => {
        await expect(
          executor.connect(user1).setTokenSupport(await mockZRC20.getAddress(), false)
        ).to.be.revertedWithCustomError(executor, "OwnableUnauthorizedAccount");
      });

      it("should revert setting support for zero address", async () => {
        await expect(executor.setTokenSupport(ethers.ZeroAddress, true))
          .to.be.revertedWith("Invalid token address");
      });
    });

    describe("Fee Management", function () {
      it("should update fee recipient", async () => {
        await expect(executor.setFeeRecipient(feeRecipient.address))
          .to.emit(executor, "FeeRecipientUpdated")
          .withArgs(owner.address, feeRecipient.address);

        expect(await executor.feeRecipient()).to.equal(feeRecipient.address);
      });

      it("should revert fee recipient update from non-owner", async () => {
        await expect(
          executor.connect(user1).setFeeRecipient(feeRecipient.address)
        ).to.be.revertedWithCustomError(executor, "OwnableUnauthorizedAccount");
      });

      it("should revert setting zero address as fee recipient", async () => {
        await expect(executor.setFeeRecipient(ethers.ZeroAddress))
          .to.be.revertedWith("Invalid fee recipient");
      });
    });

    describe("Pause/Unpause", function () {
      it("should pause and unpause contract", async () => {
        await executor.pause();
        expect(await executor.paused()).to.be.true;

        const action = {
          actionType: "mintNFT",
          recipient: user1.address,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: DEFAULT_METADATA_URI,
          tokenId: 0,
        };

        await expect(executor.executeActions([action]))
          .to.be.revertedWithCustomError(executor, "EnforcedPause");

        await executor.unpause();
        expect(await executor.paused()).to.be.false;

        await executor.executeActions([action]); // Should work now
      });

      it("should revert pause from non-owner", async () => {
        await expect(executor.connect(user1).pause())
          .to.be.revertedWithCustomError(executor, "OwnableUnauthorizedAccount");
      });
    });

    describe("Emergency Functions", function () {
      it("should emergency withdraw tokens", async () => {
        const amount = ethers.parseEther("100");
        await mockZRC20.mint(await executor.getAddress(), amount);

        const initialBalance = await mockZRC20.balanceOf(owner.address);
        await executor.emergencyWithdraw(await mockZRC20.getAddress(), amount);
        const finalBalance = await mockZRC20.balanceOf(owner.address);

        expect(finalBalance - initialBalance).to.equal(amount);
      });

      it("should revert emergency withdraw from non-owner", async () => {
        await expect(
          executor.connect(user1).emergencyWithdraw(await mockZRC20.getAddress(), 100)
        ).to.be.revertedWithCustomError(executor, "OwnableUnauthorizedAccount");
      });
    });
  });

  describe("View Functions", function () {
    beforeEach(async () => {
      const amount = ethers.parseEther("100");
      await mockZRC20.connect(user1).approve(await executor.getAddress(), amount);
      
      const depositAction = {
        actionType: "deposit",
        recipient: ethers.ZeroAddress,
        amount,
        tokenAddress: await mockZRC20.getAddress(),
        targetChainId: 0,
        metadataURI: "",
        tokenId: 0,
      };
      
      await executor.connect(user1).executeActions([depositAction]);
    });

    it("should get ZRC20 info", async () => {
      const info = await executor.getZRC20Info(await mockZRC20.getAddress());
      
      expect(info.supply).to.be.gt(0);
      expect(info.balance).to.be.gt(0);
      expect(info.allowance_).to.equal(0);
      expect(info.feeToken).to.equal(await mockZRC20.getAddress());
      expect(info.flatFee).to.equal(ethers.parseEther("0.001"));
    });

    it("should get user balance", async () => {
      const balance = await executor.getUserBalance(user1.address, await mockZRC20.getAddress());
      expect(balance).to.be.gt(0);
    });

    it("should get user balances for multiple tokens", async () => {
      const balances = await executor.getUserBalances(
        user1.address,
        [await mockZRC20.getAddress(), await mockZRC20_2.getAddress()]
      );
      
      expect(balances.length).to.equal(2);
      expect(balances[0]).to.be.gt(0);
      expect(balances[1]).to.equal(0);
    });

    it("should check transaction processing status", async () => {
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      expect(await executor.isTransactionProcessed(txHash)).to.be.false;
    });
  });

  describe("Edge Cases", function () {
    it("should handle ETH deposits to contract", async () => {
      await expect(
        owner.sendTransaction({
          to: await executor.getAddress(),
          value: ethers.parseEther("1")
        })
      ).to.not.be.reverted;

      expect(await ethers.provider.getBalance(await executor.getAddress()))
        .to.equal(ethers.parseEther("1"));
    });

    it("should handle gas estimation for complex operations", async () => {
      const actions = [
        {
          actionType: "mintNFT",
          recipient: user1.address,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: DEFAULT_METADATA_URI,
          tokenId: 0,
        },
        {
          actionType: "mintNFT",
          recipient: user2.address,
          amount: 0,
          tokenAddress: ethers.ZeroAddress,
          targetChainId: 0,
          metadataURI: "ipfs://QmToken2",
          tokenId: 0,
        }
      ];

      const gasEstimate = await executor.executeActions.estimateGas(actions);
      expect(gasEstimate).to.be.gt(0);
    });

    it("should handle maximum fee scenarios", async () => {
      expect(await executor.FEE_BASIS_POINTS()).to.be.lte(await executor.MAX_FEE_BASIS_POINTS());
    });
  });
});