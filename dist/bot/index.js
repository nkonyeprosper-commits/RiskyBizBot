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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramBotService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const config_1 = require("../config");
const orderHandler_1 = require("./handlers/orderHandler");
const adminHandler_1 = require("./handlers/adminHandler");
const keyboards_1 = require("./keyboards");
const types_1 = require("../types");
const PaymentVerificationService_1 = require("../services/PaymentVerificationService");
class TelegramBotService {
    constructor(orderService, priceService, blockchainService) {
        this.orderService = orderService;
        this.priceService = priceService;
        this.blockchainService = blockchainService;
        this.bot = new node_telegram_bot_api_1.default(config_1.config.botToken, { polling: true });
        // Initialize PaymentVerificationService
        this.paymentVerificationService = new PaymentVerificationService_1.PaymentVerificationService(this.orderService, this.blockchainService, this.bot);
        this.orderHandler = new orderHandler_1.OrderHandler(this.bot, this.orderService, this.priceService, this.blockchainService, this.paymentVerificationService // Pass it to OrderHandler
        );
        this.adminHandler = new adminHandler_1.AdminHandler(this.bot, this.orderService, this.blockchainService);
        this.setupBotCommands();
        this.setupHandlers();
        this.startPeriodicVerification();
    }
    setupBotCommands() {
        this.bot.setMyCommands([
            {
                command: "/start",
                description: "Start interacting with bot",
            },
            { command: "/help", description: "Get information" },
            { command: "/orders", description: "Get current orders" },
            // Add admin commands if needed
            { command: "/verify", description: "Verify payments (Admin)" },
            { command: "/pending", description: "View pending orders (Admin)" },
            { command: "/stats", description: "View statistics (Admin)" },
        ]);
    }
    setupHandlers() {
        // Command handlers
        this.bot.onText(/\/start/, this.handleStart.bind(this));
        this.bot.onText(/\/help/, this.handleHelp.bind(this));
        this.bot.onText(/\/orders/, this.handleMyOrders.bind(this));
        // this.bot.onText(/\/getInfoRisk/, this.getGroupId.bind(this));
        // Admin commands
        this.bot.onText(/\/(verify|pending|stats)/, (msg) => {
            this.adminHandler.handleAdminCommand(msg);
        });
        // Callback query handler
        this.bot.on("callback_query", (query) => {
            this.orderHandler.handleCallbackQuery(query);
        });
        // Text message handler
        this.bot.on("message", (msg) => {
            if (msg.text && !msg.text.startsWith("/")) {
                return;
            }
            this.orderHandler.handleTextMessage(msg);
        });
        // Error handling
        this.bot.on("error", (error) => {
            console.error("Bot error:", error);
        });
        console.log("Telegram bot started successfully");
    }
    // private async getGroupId(msg: TelegramBot.Message): Promise<void> {
    //   const chatId = msg.chat.id;
    //   console.log(chatId, "Call me ooooo here");
    // }
    // Start periodic verification of all pending orders
    startPeriodicVerification() {
        // Run batch verification every 5 minutes
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.paymentVerificationService.verifyAllPendingOrders();
            }
            catch (error) {
                console.error("Error in periodic verification:", error);
            }
        }), 300000); // 5 minutes
        console.log("Periodic payment verification started");
    }
    // Graceful shutdown
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Shutting down bot...");
            // Stop payment verifications
            this.paymentVerificationService.cleanup();
            // Stop bot polling
            yield this.bot.stopPolling();
            console.log("Bot shutdown complete");
            process.exit(0);
        });
    }
    handleStart(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const chatId = msg.chat.id;
            const welcomeMessage = `
    🚀 *Welcome to Risky Business Payment Portal*

    Your one-stop solution for crypto project promotion!

    🔥 **Available Services:**
    • 📌 Pin Service - Pin your posts for maximum visibility
    • 🤖 BuyBot Service - Automated buying assistance  
    • 🔥 Combo - Best value with both services

    💰 **Competitive Pricing:**
    • Pin: $50 per post (48h)
    • BuyBot: $50 (48h)
    • Combo: $50 total (48h)

    Ready to get started?
    `;
            yield this.bot.sendMessage(chatId, welcomeMessage, {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getMainMenuKeyboard(),
            });
        });
    }
    handleHelp(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const chatId = msg.chat.id;
            const helpMessage = `
    ❓ *Help & Support*

    **How to place an order:**
    1. Click "Start New Order"
    2. Enter project details
    3. Choose your service type
    4. Set dates and preferences
    5. Make payment
    6. Submit transaction hash

    **Supported Networks:**
    • 🟡 BSC (Binance Smart Chain)
    • 🔵 Ethereum
    • 🔵 Base

    **Payment Methods:**
    • Direct wallet transfers
    • CEX transfers supported

    **Need help?** Contact our support team!
    `;
            yield this.bot.sendMessage(chatId, helpMessage, {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getMainMenuKeyboard(),
            });
        });
    }
    handleMyOrders(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const chatId = msg.chat.id;
            const userId = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.id;
            const orders = yield this.orderService.getUserOrders(userId);
            if (orders.length === 0) {
                yield this.bot.sendMessage(chatId, "📝 You haven't placed any orders yet.");
                return;
            }
            let message = "📋 *Your Orders:*\n\n";
            orders.slice(0, 5).forEach((order, index) => {
                const statusEmoji = this.getStatusEmoji(order.paymentInfo.status);
                message += `${statusEmoji} **Order ${index + 1}**\n`;
                message += `📱 ${order.projectDetails.name}\n`;
                message += `💰 ${order.totalPrice} - ${order.paymentInfo.status}\n`;
                message += `🆔 \`${order._id}\`\n\n`;
            });
            yield this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        });
    }
    getStatusEmoji(status) {
        switch (status) {
            case types_1.PaymentStatus.PENDING:
                return "⏳";
            case types_1.PaymentStatus.CONFIRMED:
                return "✅";
            case types_1.PaymentStatus.FAILED:
                return "❌";
            default:
                return "❓";
        }
    }
    // Public method to get verification service (for external use)
    getPaymentVerificationService() {
        return this.paymentVerificationService;
    }
    // Public method to get bot instance (for external use)
    getBot() {
        return this.bot;
    }
}
exports.TelegramBotService = TelegramBotService;
//# sourceMappingURL=index.js.map