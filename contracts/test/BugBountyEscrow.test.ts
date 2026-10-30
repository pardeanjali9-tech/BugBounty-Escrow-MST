import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { BugBountyEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BugBountyEscrow", function () {
  let escrow: BugBountyEscrow;
  let owner: SignerWithAddress;
  let reviewer: SignerWithAddress;
  let researcher: SignerWithAddress;
  let stranger: SignerWithAddress;

  const minReward = ethers.parseEther("0.1"); // 0.1 tMSTC
  const maxReward = ethers.parseEther("2.0"); // 2.0 tMSTC
  const initialDeposit = ethers.parseEther("5.0"); // 5.0 tMSTC

  beforeEach(async function () {
    [owner, reviewer, researcher, stranger] = await ethers.getSigners();

    const BugBountyEscrowFactory = await ethers.getContractFactory("BugBountyEscrow");
    escrow = (await BugBountyEscrowFactory.deploy()) as unknown as BugBountyEscrow;
    await escrow.waitForDeployment();
  });

  describe("Program Management", function () {
    it("should create a program with initial funding", async function () {
      const tx = await escrow.connect(owner).createProgram(
        "VEIL Core Escrow Bug Bounty",
        "Scope: BugBountyEscrow smart contract and cryptographic verification",
        minReward,
        maxReward,
        true,
        { value: initialDeposit }
      );

      await expect(tx)
        .to.emit(escrow, "ProgramCreated")
        .withArgs(1, owner.address, "VEIL Core Escrow Bug Bounty", minReward, maxReward, true, initialDeposit);

      const prog = await escrow.getProgram(1);
      expect(prog.id).to.equal(1);
      expect(prog.owner).to.equal(owner.address);
      expect(prog.totalFunded).to.equal(initialDeposit);
      expect(prog.reservedRewards).to.equal(0n);
      expect(prog.paidRewards).to.equal(0n);
      expect(prog.active).to.be.true;
      expect(await escrow.getAvailableFunds(1)).to.equal(initialDeposit);
    });

    it("should revert if minReward > maxReward", async function () {
      await expect(
        escrow.connect(owner).createProgram("Bad Program", "desc", maxReward, minReward, true)
      ).to.be.revertedWithCustomError(escrow, "InvalidRewardAmount");
    });

    it("should allow additional funding by anyone", async function () {
      await escrow.connect(owner).createProgram("Test", "desc", minReward, maxReward, true, {
        value: initialDeposit,
      });

      const topup = ethers.parseEther("1.0");
      await expect(escrow.connect(stranger).fundProgram(1, { value: topup }))
        .to.emit(escrow, "ProgramFunded")
        .withArgs(1, stranger.address, topup, initialDeposit + topup);

      expect(await escrow.getAvailableFunds(1)).to.equal(initialDeposit + topup);
    });

    it("should manage reviewers correctly", async function () {
      await escrow.connect(owner).createProgram("Test", "desc", minReward, maxReward, true);

      expect(await escrow.isReviewer(1, owner.address)).to.be.true;
      expect(await escrow.isReviewer(1, reviewer.address)).to.be.false;

      await expect(escrow.connect(owner).setReviewer(1, reviewer.address, true))
        .to.emit(escrow, "ReviewerUpdated")
        .withArgs(1, reviewer.address, true);

      expect(await escrow.isReviewer(1, reviewer.address)).to.be.true;

      // Stranger cannot set reviewer
      await expect(
        escrow.connect(stranger).setReviewer(1, stranger.address, true)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should allow owner to close program and withdraw unreserved funds", async function () {
      await escrow.connect(owner).createProgram("Test", "desc", minReward, maxReward, true, {
        value: initialDeposit,
      });

      await escrow.connect(owner).closeProgram(1);
      const prog = await escrow.getProgram(1);
      expect(prog.active).to.be.false;

      const withdrawAmount = ethers.parseEther("2.0");
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await escrow.connect(owner).withdrawUnreservedFunds(1, withdrawAmount);
      const receipt = await tx.wait();
      const gasSpent = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.equal(balanceBefore + withdrawAmount - gasSpent);

      expect(await escrow.getAvailableFunds(1)).to.equal(initialDeposit - withdrawAmount);
    });
  });

  describe("Report Submission & State Machine", function () {
    let dummyCommitment: string;
    const storageRef = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    beforeEach(async function () {
      await escrow.connect(owner).createProgram("VEIL Test", "desc", minReward, maxReward, true, {
        value: initialDeposit,
      });
      await escrow.connect(owner).setReviewer(1, reviewer.address, true);

      dummyCommitment = ethers.keccak256(ethers.toUtf8Bytes("canonical-report-payload-nonce-12345"));
    });

    it("should submit a report and emit ReportSubmitted", async function () {
      const tx = await escrow.connect(researcher).submitReport(
        1,
        dummyCommitment,
        storageRef,
        2 // High severity
      );

      await expect(tx)
        .to.emit(escrow, "ReportSubmitted")
        .withArgs(1, 1, researcher.address, dummyCommitment, storageRef, 2, anyValue);

      const report = await escrow.getReport(1);
      expect(report.id).to.equal(1);
      expect(report.programId).to.equal(1);
      expect(report.researcher).to.equal(researcher.address);
      expect(report.commitment).to.equal(dummyCommitment);
      expect(report.encryptedReportRef).to.equal(storageRef);
      expect(report.severity).to.equal(2);
      expect(report.status).to.equal(0); // Submitted
    });

    it("should transition through Submitted -> UnderReview -> Approved -> Claimed", async function () {
      await escrow.connect(researcher).submitReport(1, dummyCommitment, storageRef, 3);

      // Stranger cannot start review
      await expect(escrow.connect(stranger).startReview(1)).to.be.revertedWithCustomError(
        escrow,
        "Unauthorized"
      );

      // Authorized reviewer starts review
      await expect(escrow.connect(reviewer).startReview(1))
        .to.emit(escrow, "ReportReviewStarted")
        .withArgs(1, reviewer.address, anyValue);

      let rep = await escrow.getReport(1);
      expect(rep.status).to.equal(1); // UnderReview

      // Approve report with 1.5 tMSTC reward
      const reward = ethers.parseEther("1.5");
      await expect(escrow.connect(reviewer).approveReport(1, reward))
        .to.emit(escrow, "ReportApproved")
        .withArgs(1, reviewer.address, reward, anyValue);

      rep = await escrow.getReport(1);
      expect(rep.status).to.equal(2); // Approved
      expect(rep.approvedReward).to.equal(reward);

      // Check escrow accounting: available funds reduced by reward
      expect(await escrow.getAvailableFunds(1)).to.equal(initialDeposit - reward);

      // Stranger cannot claim reward
      await expect(escrow.connect(stranger).claimReward(1)).to.be.revertedWithCustomError(
        escrow,
        "Unauthorized"
      );

      // Researcher claims reward
      const balanceBefore = await ethers.provider.getBalance(researcher.address);
      const claimTx = await escrow.connect(researcher).claimReward(1);
      const claimReceipt = await claimTx.wait();
      const gasUsed = claimReceipt!.gasUsed * claimReceipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(researcher.address);

      expect(balanceAfter).to.equal(balanceBefore + reward - gasUsed);

      rep = await escrow.getReport(1);
      expect(rep.status).to.equal(5); // Claimed

      // Duplicate claim must fail
      await expect(escrow.connect(researcher).claimReward(1)).to.be.revertedWithCustomError(
        escrow,
        "InvalidStateTransition"
      );
    });

    it("should handle Rejection and Appeal flow: Submitted -> UnderReview -> Rejected -> Appealed -> UnderReview", async function () {
      await escrow.connect(researcher).submitReport(1, dummyCommitment, storageRef, 1);
      await escrow.connect(reviewer).startReview(1);

      // Reject report
      await expect(escrow.connect(reviewer).rejectReport(1, "Out of scope vulnerability"))
        .to.emit(escrow, "ReportRejected")
        .withArgs(1, reviewer.address, "Out of scope vulnerability", anyValue);

      let rep = await escrow.getReport(1);
      expect(rep.status).to.equal(3); // Rejected
      expect(rep.rejectionReason).to.equal("Out of scope vulnerability");

      // Appeal report by researcher
      const appealRef = "bafybeiappealreference1234567";
      await expect(escrow.connect(researcher).appealReport(1, appealRef))
        .to.emit(escrow, "ReportAppealed")
        .withArgs(1, researcher.address, appealRef, anyValue);

      rep = await escrow.getReport(1);
      expect(rep.status).to.equal(4); // Appealed
      expect(rep.appealRef).to.equal(appealRef);

      // Reviewer can pick up appealed report back to UnderReview
      await escrow.connect(reviewer).startReview(1);
      rep = await escrow.getReport(1);
      expect(rep.status).to.equal(1); // UnderReview again
    });

    it("should prevent owner from withdrawing reserved funds", async function () {
      await escrow.connect(researcher).submitReport(1, dummyCommitment, storageRef, 2);
      await escrow.connect(reviewer).startReview(1);

      const reward = ethers.parseEther("1.0");
      await escrow.connect(reviewer).approveReport(1, reward);

      // Available funds are 5 - 1 = 4 tMSTC
      // Owner tries to withdraw 4.5 tMSTC -> must revert
      await expect(
        escrow.connect(owner).withdrawUnreservedFunds(1, ethers.parseEther("4.5"))
      ).to.be.revertedWithCustomError(escrow, "InsufficientEscrowFunds");

      // Owner can withdraw unreserved 4.0 tMSTC
      await expect(escrow.connect(owner).withdrawUnreservedFunds(1, ethers.parseEther("4.0"))).to.not.be
        .reverted;

      // Available is now 0
      expect(await escrow.getAvailableFunds(1)).to.equal(0n);

      // Researcher can still safely claim their 1.0 tMSTC
      await expect(escrow.connect(researcher).claimReward(1)).to.not.be.reverted;
    });

    it("should prevent approving rewards that exceed available escrow funds", async function () {
      // Create small program with only 0.5 tMSTC
      await escrow.connect(owner).createProgram("Small", "desc", minReward, maxReward, false, {
        value: ethers.parseEther("0.5"),
      });

      // Submit report to program 2
      const tx = await escrow.connect(researcher).submitReport(2, dummyCommitment, storageRef, 3);
      const receipt = await tx.wait();
      // This is report ID 1 since it's the first report in this test
      await escrow.connect(owner).startReview(1);

      // Attempt to approve 1.0 tMSTC when only 0.5 tMSTC is available
      await expect(
        escrow.connect(owner).approveReport(1, ethers.parseEther("1.0"))
      ).to.be.revertedWithCustomError(escrow, "InsufficientEscrowFunds");
    });

    it("should enforce accounting invariants: totalFunded >= reservedRewards + paidRewards", async function () {
      const prog = await escrow.getProgram(1);
      expect(prog.totalFunded).to.be.gte(prog.reservedRewards + prog.paidRewards);
    });
  });
});
