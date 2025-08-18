import dotenv from "dotenv";

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN!,
  mongoUri: process.env.MONGODB_URI!,
  rpcUrls: {
    bsc: process.env.BSC_RPC_URL!,
    ethereum: process.env.ETH_RPC_URL!,
    base: process.env.BASE_RPC_URL!,
  },
  adminUserIds:
    process.env.ADMIN_USER_IDS?.split(",").map((id) => parseInt(id)) || [],
  timezone: process.env.TIMEZONE || "UTC",
  prices: {
    pin: 50, // $50 per post per 48h
    buybot: 50, // $50 per 48h
    combo: 50, // $50 total for both for 48h
  },
  walletAddresses: {
    bsc: "0xA9a06682baae823a5Fe34c99bc4bECC7d67475B3",
    ethereum: "0xA9a06682baae823a5Fe34c99bc4bECC7d67475B3",
    base: "0xA9a06682baae823a5Fe34c99bc4bECC7d67475B3",
  },
  adminChannelId: process.env.ADMIN_CHANNEL_ID || "", // e.g., "-1001234567890"
  // Optional: Add media size limits
  maxFileSize: 50 * 1024 * 1024, // 50MB limit
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "application/octet-stream", // For some GIFs
  ],
};
