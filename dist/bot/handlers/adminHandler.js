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
exports.AdminHandler = void 0;
const types_1 = require("../../types");
const config_1 = require("../../config");
class AdminHandler {
    constructor(bot, orderService, blockchainService) {
        this.bot = bot;
        this.orderService = orderService;
        this.blockchainService = blockchainService;
    }
    handleAdminCommand(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const chatId = msg.chat.id;
            const userId = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.id;
            const text = msg.text;
            if (!config_1.config.adminUserIds.includes(userId)) {
                return;
            }
            if (text.startsWith("/verify")) {
                const orderId = text.split(" ")[1];
                if (orderId) {
                    yield this.verifyPayment(chatId, orderId);
                }
                else {
                    yield this.bot.sendMessage(chatId, "Usage: /verify <order_id>");
                }
            }
            else if (text === "/pending") {
                yield this.showPendingOrders(chatId);
            }
            else if (text === "/stats") {
                yield this.showStats(chatId);
            }
        });
    }
    verifyPayment(chatId, orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.orderService.getOrder(orderId);
                if (!order) {
                    yield this.bot.sendMessage(chatId, "❌ Order not found.");
                    return;
                }
                if (order.paymentInfo.status !== types_1.PaymentStatus.PENDING) {
                    yield this.bot.sendMessage(chatId, `ℹ️ Order already ${order.paymentInfo.status}.`);
                    return;
                }
                const isValid = yield this.blockchainService.validateTransaction(order.paymentInfo.txnHash, order.paymentInfo.network, order.paymentInfo.amount, order.paymentInfo.walletAddress);
                const newStatus = isValid
                    ? types_1.PaymentStatus.CONFIRMED
                    : types_1.PaymentStatus.FAILED;
                yield this.orderService.updateOrder(orderId, {
                    paymentInfo: Object.assign(Object.assign({}, order.paymentInfo), { status: newStatus }),
                });
                const statusEmoji = isValid ? "✅" : "❌";
                const statusText = isValid ? "CONFIRMED" : "FAILED";
                yield this.bot.sendMessage(chatId, `${statusEmoji} Order ${orderId} payment ${statusText}`);
                // Notify user
                yield this.notifyUser(order, newStatus);
            }
            catch (error) {
                console.error("Payment verification error:", error);
                yield this.bot.sendMessage(chatId, "❌ Error verifying payment.");
            }
        });
    }
    notifyUser(order, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const statusEmoji = status === types_1.PaymentStatus.CONFIRMED ? "✅" : "❌";
            const statusText = status === types_1.PaymentStatus.CONFIRMED ? "confirmed" : "failed";
            const message = `
${statusEmoji} *Payment ${statusText.toUpperCase()}*

🆔 **Order ID:** \`${order._id}\`
📱 **Project:** ${order.projectDetails.name}
💰 **Amount:** ${order.totalPrice}

${status === types_1.PaymentStatus.CONFIRMED
                ? "🚀 Your service will begin as scheduled!"
                : "❌ Please contact support or submit a new order with correct payment."}
    `;
            try {
                yield this.bot.sendMessage(order.userId, message, {
                    parse_mode: "Markdown",
                });
            }
            catch (error) {
                console.error("Failed to notify user:", error);
            }
        });
    }
    showPendingOrders(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implementation would fetch pending orders from database
            yield this.bot.sendMessage(chatId, "📋 Fetching pending orders...");
        });
    }
    showStats(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implementation would show order statistics
            yield this.bot.sendMessage(chatId, "📊 Fetching statistics...");
        });
    }
}
exports.AdminHandler = AdminHandler;
//# sourceMappingURL=adminHandler.js.map