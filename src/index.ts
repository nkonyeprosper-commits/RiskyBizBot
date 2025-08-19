import express from "express";
import { database } from "./database/connection";
import { OrderService } from "./services/orderService";
import { PriceService } from "./services/priceService";
import { BlockchainService } from "./services/blockchainService";
import { TelegramBotService } from "./bot";

async function main() {
  try {
    // Connect to database
    await database.connect();

    // Initialize services
    const orderService = new OrderService();
    const priceService = new PriceService();
    const blockchainService = new BlockchainService();

    // Start bot
    const bot = new TelegramBotService(
      orderService,
      priceService,
      blockchainService
    );

    console.log("🚀 Risky Business Payment Portal Bot is running...");

    // --- Minimal Express server ---
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Health check route
    app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok", uptime: process.uptime() });
    });

    // Start express server
    app.listen(PORT, () => {
      console.log(`✅ Healthcheck server listening on port ${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Shutting down...");
      await database.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

main().catch(console.error);
