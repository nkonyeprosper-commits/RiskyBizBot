"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    botToken: process.env.BOT_TOKEN,
    mongoUri: process.env.MONGODB_URI,
    rpcUrls: {
        bsc: process.env.BSC_RPC_URL,
        ethereum: process.env.ETH_RPC_URL,
        base: process.env.BASE_RPC_URL,
    },
    adminUserIds: ((_a = process.env.ADMIN_USER_IDS) === null || _a === void 0 ? void 0 : _a.split(",").map((id) => parseInt(id))) || [],
    timezone: process.env.TIMEZONE || "UTC",
    prices: {
        pin: 50, // $50 per post per 48h
        buybot: 50, // $50 per 48h
        combo: 50, // $50 total for both for 48h
    },
    walletAddresses: {
        bsc: process.env.ADMIN_WALLET_BSC,
        ethereum: process.env.ADMIN_WALLET_ETH,
        base: process.env.ADMIN_WALLET_BASE,
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
//# sourceMappingURL=index.js.map