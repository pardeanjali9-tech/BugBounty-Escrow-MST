import { BACKEND_API_URL } from "../config/coralConfig";
import { Program, EncryptedReportData } from "../types";

export class VeilApiService {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${BACKEND_API_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        ...options,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `API request failed with status ${res.status}`);
      }
      return data as T;
    } catch (err: any) {
      console.warn(`Veil API Error at ${endpoint}:`, err.message);
      throw err;
    }
  }

  static async getHealth(): Promise<any> {
    return this.request<any>("/health");
  }

  static async getPrograms(): Promise<{ success: boolean; total: number; programs: Program[] }> {
    return this.request<{ success: boolean; total: number; programs: Program[] }>("/programs");
  }

  static async getProgramById(id: number): Promise<{ success: boolean; program: Program; metrics: { reportsCount: number } }> {
    return this.request<{ success: boolean; program: Program; metrics: { reportsCount: number } }>(`/programs/${id}`);
  }

  static async storeEncryptedReport(payload: {
    programId: number;
    researcher: string;
    commitment: string;
    ciphertext: string;
    iv: string;
    wrappedKey: string;
    reviewerPublicKey?: string;
    metadata: {
      severity: number;
      submittedAt: number;
      titleCommitment?: string;
    };
  }): Promise<{
    success: boolean;
    storageRef: string;
    id: string;
    sha256Fingerprint: string;
    storedAt: string;
  }> {
    return this.request("/storage/encrypted-report", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async getEncryptedReport(id: string): Promise<{ success: boolean; data: EncryptedReportData }> {
    return this.request<{ success: boolean; data: EncryptedReportData }>(`/storage/encrypted-report/${id}`);
  }

  static async getReportsByProgram(programId: number): Promise<{ success: boolean; total: number; reports: any[] }> {
    return this.request<{ success: boolean; total: number; reports: any[] }>(`/reports/program/${programId}`);
  }

  static async getReportsByResearcher(address: string): Promise<{ success: boolean; total: number; reports: any[] }> {
    return this.request<{ success: boolean; total: number; reports: any[] }>(`/reports/researcher/${address}`);
  }

  static async getTransactionStatus(hash: string): Promise<{ success: boolean; transaction: any }> {
    return this.request<{ success: boolean; transaction: any }>(`/transactions/${hash}`);
  }

  static async getAuthChallenge(address: string): Promise<{ success: boolean; address: string; nonce: string; message: string }> {
    return this.request<{ success: boolean; address: string; nonce: string; message: string }>(`/auth/challenge?address=${address}`);
  }

  static async verifyAuth(address: string, signature: string, message: string): Promise<{ success: boolean; authenticated: boolean; sessionToken: string }> {
    return this.request<{ success: boolean; authenticated: boolean; sessionToken: string }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ address, signature, message }),
    });
  }
}

