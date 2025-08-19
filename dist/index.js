"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./database/connection");
const orderService_1 = require("./services/orderService");
const priceService_1 = require("./services/priceService");
const blockchainService_1 = require("./services/blockchainService");
const bot_1 = require("./bot");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to database
            yield connection_1.database.connect();
            // Initialize services
            const orderService = new orderService_1.OrderService();
            const priceService = new priceService_1.PriceService();
            const blockchainService = new blockchainService_1.BlockchainService();
            // Start bot
            const bot = new bot_1.TelegramBotService(orderService, priceService, blockchainService);
            console.log("🚀 Risky Business Payment Portal Bot is running...");
            // Graceful shutdown
            process.on("SIGINT", () => __awaiter(this, void 0, void 0, function* () {
                console.log("Shutting down...");
                yield connection_1.database.disconnect();
                process.exit(0);
            }));
        }
        catch (error) {
            console.error("Failed to start application:", error);
            process.exit(1);
        }
    });
}
main().catch(console.error);
//# sourceMappingURL=index.js.map