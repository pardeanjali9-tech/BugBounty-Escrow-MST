import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface EncryptedReportPayload {
  programId: number;
  researcher: string;
  commitment: string;
  ciphertext: string; // Base64 encoded AES-256-GCM ciphertext
  iv: string; // Base64 encoded 12-byte IV
  wrappedKey: string; // Reviewer/Program public key wrapped AES key
  reviewerPublicKey?: string;
  metadata: {
    titleCommitment?: string;
    severity: number;
    submittedAt: number;
    fileAttachmentRefs?: string[];
  };
}

export interface StoredEncryptedReport {
  id: string;
  storageRef: string;
  programId: number;
  researcher: string;
  commitment: string;
  ciphertext: string;
  iv: string;
  wrappedKey: string;
  reviewerPublicKey?: string;
  metadata: {
    titleCommitment?: string;
    severity: number;
    submittedAt: number;
  };
  storedAt: string;
  sha256Fingerprint: string;
}

export class StorageService {
  private dataDir: string;
  private reportsFile: string;
  private reportsIndex: Map<string, StoredEncryptedReport>;

  constructor(customDataDir?: string) {
    this.dataDir = customDataDir || (process.env.VERCEL ? "/tmp/encrypted_reports" : path.resolve(__dirname, "../../data/encrypted_reports"));
    this.reportsFile = path.join(this.dataDir, "index.json");
    this.reportsIndex = new Map();
    this.init();
  }

  private init(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.reportsFile)) {
      try {
        const raw = fs.readFileSync(this.reportsFile, "utf-8");
        const list: StoredEncryptedReport[] = JSON.parse(raw);
        for (const item of list) {
          this.reportsIndex.set(item.id, item);
        }
      } catch (e) {
        console.error("Failed to parse existing reports index, starting fresh:", e);
      }
    }
  }

  private persistIndex(): void {
    const list = Array.from(this.reportsIndex.values());
    fs.writeFileSync(this.reportsFile, JSON.stringify(list, null, 2), "utf-8");
  }

  async storeEncryptedReport(payload: EncryptedReportPayload): Promise<StoredEncryptedReport> {
    if (!payload.ciphertext || !payload.iv || !payload.commitment || !payload.researcher) {
      throw new Error("Missing required encrypted report fields: ciphertext, iv, commitment, researcher");
    }

    // Check payload size (limit: 5 MB)
    const byteLength = Buffer.byteLength(payload.ciphertext, "utf8");
    if (byteLength > 5 * 1024 * 1024) {
      throw new Error("Ciphertext exceeds maximum allowable size of 5 MB");
    }

    // Generate SHA-256 fingerprint of the ciphertext
    const sha256Fingerprint = crypto
      .createHash("sha256")
      .update(payload.ciphertext)
      .digest("hex");

    const storageId = `veil-enc-${sha256Fingerprint.slice(0, 16)}-${Date.now()}`;
    const storageRef = `veil://${storageId}`;

    const storedReport: StoredEncryptedReport = {
      id: storageId,
      storageRef: storageRef,
      programId: payload.programId,
      researcher: payload.researcher.toLowerCase(),
      commitment: payload.commitment,
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      wrappedKey: payload.wrappedKey,
      reviewerPublicKey: payload.reviewerPublicKey,
      metadata: payload.metadata,
      storedAt: new Date().toISOString(),
      sha256Fingerprint,
    };

    // Write individual encrypted file
    const filePath = path.join(this.dataDir, `${storageId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(storedReport, null, 2), "utf-8");

    // Update index
    this.reportsIndex.set(storageId, storedReport);
    this.persistIndex();

    return storedReport;
  }

  async getEncryptedReport(id: string): Promise<StoredEncryptedReport | null> {
    // Check if passed as veil:// URI or plain ID
    const cleanId = id.replace("veil://", "");
    const inMemory = this.reportsIndex.get(cleanId);
    if (inMemory) return inMemory;

    const filePath = path.join(this.dataDir, `${cleanId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed: StoredEncryptedReport = JSON.parse(raw);
        this.reportsIndex.set(cleanId, parsed);
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  }

  async getReportsByProgram(programId: number): Promise<StoredEncryptedReport[]> {
    return Array.from(this.reportsIndex.values()).filter(
      (r) => r.programId === programId
    );
  }

  async getReportsByResearcher(researcher: string): Promise<StoredEncryptedReport[]> {
    const clean = researcher.toLowerCase();
    return Array.from(this.reportsIndex.values()).filter(
      (r) => r.researcher === clean
    );
  }

  getTotalReportsCount(): number {
    return this.reportsIndex.size;
  }
}

export const storageService = new StorageService();

