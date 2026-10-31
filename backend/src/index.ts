import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import * as dotenv from "dotenv";

import healthRouter from "./routes/health";
import storageRouter from "./routes/storage";
import programsRouter from "./routes/programs";
import reportsRouter from "./routes/reports";
import transactionsRouter from "./routes/transactions";
import authRouter from "./routes/auth";
import { coralConfig } from "./config/coralConfig";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(generalLimiter);

// Parse JSON bodies with strict size limits (5MB for encrypted blobs)
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Route Mounts
app.use("/api/health", healthRouter);
app.use("/api/storage", storageRouter);
app.use("/api/programs", programsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/auth", authRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled server error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log("====================================================");
    console.log(`VEIL BugBounty Escrow Backend API Service`);
    console.log(`Port: ${PORT}`);
    console.log(`Target Network: ${coralConfig.networkName} (Chain ID: ${coralConfig.chainId})`);
    console.log(`Coral RPC: ${coralConfig.rpcUrls.http}`);
    console.log(`Block Explorer: ${coralConfig.blockExplorer}`);
    console.log(`Supported Wallet: ${coralConfig.wallet.supportedWallet}`);
    console.log("====================================================");
  });
}

export default app;

