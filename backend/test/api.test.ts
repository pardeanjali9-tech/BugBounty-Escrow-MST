process.env.NODE_ENV = "test";
import { expect } from "chai";
import request from "supertest";
import app from "../src/index";
import { ethers } from "ethers";

describe("VEIL Backend API Integration Tests", () => {
  it("GET /api/health should return service and Coral network status", async () => {
    const res = await request(app).get("/api/health");
    expect([200, 503]).to.include(res.status);
    expect(res.body).to.have.property("service");
    expect(res.body.network).to.have.property("name", "MST Coral Testnet");
    expect(res.body.network).to.have.property("chainId", 54635);
    expect(res.body.network).to.have.property("supportedWallet", "BridgeKey");
    expect(res.body.storage).to.have.property("status", "operational");
  });

  it("GET /api/programs should return list of programs", async () => {
    const res = await request(app).get("/api/programs");
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.programs).to.be.an("array");
    expect(res.body.programs.length).to.be.greaterThan(0);
  });

  it("GET /api/programs/1 should return program 1 details", async () => {
    const res = await request(app).get("/api/programs/1");
    expect(res.status).to.equal(200);
    expect(res.body.program).to.have.property("id", 1);
    expect(res.body.program).to.have.property("title");
    expect(res.body.metrics).to.have.property("reportsCount");
  });

  it("POST /api/storage/encrypted-report should reject invalid payload", async () => {
    const res = await request(app)
      .post("/api/storage/encrypted-report")
      .send({ title: "plaintext report" }); // Missing ciphertext, commitment, researcher

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("error");
  });

  let savedStorageId: string;
  const dummyWallet = ethers.Wallet.createRandom();

  it("POST /api/storage/encrypted-report should accept and store authenticated ciphertext", async () => {
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("canonical-test-data"));

    const payload = {
      programId: 1,
      researcher: dummyWallet.address,
      commitment: commitment,
      ciphertext: "U2FsdGVkX1+vupppZksvRf5pq5g5XjDRIpmR4...",
      iv: "QUJDREVGR0hJSktM",
      wrappedKey: "d3JhcHBlZGtleXRlc3R2YWx1ZQ==",
      reviewerPublicKey: "TEST_REVIEWER_KEY",
      metadata: {
        severity: 2,
        submittedAt: Date.now(),
      },
    };

    const res = await request(app)
      .post("/api/storage/encrypted-report")
      .send(payload);

    expect(res.status).to.equal(201);
    expect(res.body.success).to.be.true;
    expect(res.body).to.have.property("storageRef");
    expect(res.body).to.have.property("id");
    expect(res.body).to.have.property("sha256Fingerprint");

    savedStorageId = res.body.id;
  });

  it("GET /api/storage/encrypted-report/:id should retrieve stored ciphertext", async () => {
    expect(savedStorageId).to.be.a("string");
    const res = await request(app).get(`/api/storage/encrypted-report/${savedStorageId}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.data).to.have.property("ciphertext");
    expect(res.body.data).to.have.property("iv");
    expect(res.body.data).to.have.property("wrappedKey");
    expect(res.body.data.researcher).to.equal(dummyWallet.address.toLowerCase());
  });

  it("Authentication flow: challenge and signature verification", async () => {
    // 1. Get challenge
    const challengeRes = await request(app)
      .get(`/api/auth/challenge?address=${dummyWallet.address}`);

    expect(challengeRes.status).to.equal(200);
    expect(challengeRes.body.success).to.be.true;
    expect(challengeRes.body).to.have.property("message");

    const message = challengeRes.body.message;

    // 2. Sign message with wallet
    const signature = await dummyWallet.signMessage(message);

    // 3. Verify signature
    const verifyRes = await request(app)
      .post("/api/auth/verify")
      .send({
        address: dummyWallet.address,
        signature,
        message,
      });

    expect(verifyRes.status).to.equal(200);
    expect(verifyRes.body.authenticated).to.be.true;
    expect(verifyRes.body).to.have.property("sessionToken");
  });
});
