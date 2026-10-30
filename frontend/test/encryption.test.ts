import { describe, it, expect, beforeAll } from "vitest";
import { VeilEncryptionService } from "../src/services/encryption";
import { Severity, VulnerabilityPlaintext } from "../src/types";

describe("VEIL Cryptographic Encryption & Commitment Engine", () => {
  beforeAll(() => {
    // Polyfill window object and crypto in node/vitest environment if needed
    if (typeof window === "undefined") {
      (globalThis as any).window = globalThis;
    }
  });

  const sampleReport: VulnerabilityPlaintext = {
    programId: 1,
    title: "Critical Reentrancy in Escrow Withdrawal",
    severity: Severity.Critical,
    affectedComponent: "BugBountyEscrow.sol::withdrawUnreservedFunds",
    description: "State update occurs after external ether transfer invocation.",
    impact: "Total escrow depletion by malicious program owner.",
    proofOfConcept: "1. Deploy malicious attacker contract. 2. Call withdraw with fallback hook.",
    remediationRecommendation: "Implement nonReentrant modifier and perform balance deduction before transfer.",
    researcherAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    nonce: "0x0123456789abcdef0123456789abcdef",
    timestamp: 1729000000000,
  };

  it("should canonicalize report deterministically regardless of key order", () => {
    const json1 = VeilEncryptionService.canonicalize(sampleReport);

    // Shuffle keys
    const shuffled: any = {};
    const keys = Object.keys(sampleReport).reverse();
    for (const k of keys) {
      shuffled[k] = (sampleReport as any)[k];
    }
    const json2 = VeilEncryptionService.canonicalize(shuffled);

    expect(json1).to.equal(json2);
  });

  it("should compute reproducible 32-byte hex commitment", () => {
    const canonical = VeilEncryptionService.canonicalize(sampleReport);
    const commitment = VeilEncryptionService.computeCommitment(canonical);

    expect(commitment).to.be.a("string");
    expect(commitment.startsWith("0x")).to.be.true;
    expect(commitment.length).to.equal(66); // 0x + 64 hex chars (32 bytes)
  });

  it("should encrypt and successfully decrypt and verify integrity", async () => {
    // 1. Encrypt locally
    const encrypted = await VeilEncryptionService.encryptReport(sampleReport);

    expect(encrypted.ciphertextBase64).to.be.a("string");
    expect(encrypted.ivBase64).to.be.a("string");
    expect(encrypted.commitment).to.equal(
      VeilEncryptionService.computeCommitment(encrypted.canonicalJson)
    );

    // 2. Decrypt as authorized reviewer and verify against on-chain commitment
    const decrypted = await VeilEncryptionService.decryptAndVerifyReport(
      encrypted.ciphertextBase64,
      encrypted.ivBase64,
      encrypted.wrappedKeyBase64,
      encrypted.commitment
    );

    expect(decrypted.verified).to.be.true;
    expect(decrypted.report.title).to.equal(sampleReport.title);
    expect(decrypted.report.severity).to.equal(sampleReport.severity);
    expect(decrypted.report.affectedComponent).to.equal(sampleReport.affectedComponent);
  });

  it("should fail integrity check if expected commitment is mismatched", async () => {
    const encrypted = await VeilEncryptionService.encryptReport(sampleReport);
    const fakeCommitment = "0x0000000000000000000000000000000000000000000000000000000000000000";

    await expect(
      VeilEncryptionService.decryptAndVerifyReport(
        encrypted.ciphertextBase64,
        encrypted.ivBase64,
        encrypted.wrappedKeyBase64,
        fakeCommitment
      )
    ).rejects.toThrow(/INTEGRITY BREACH DETECTED/);
  });
});

