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
exports.PaymentVerificationService = void 0;
const types_1 = require("../types");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
class PaymentVerificationService {
    constructor(orderService, blockchainService, bot) {
        this.orderService = orderService;
        this.blockchainService = blockchainService;
        this.bot = bot;
        this.verificationIntervals = new Map();
    }
    // Start verification for a specific order
    startOrderVerification(orderId, chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`🔄 Starting verification for order: ${orderId}`);
            let attempts = 0;
            const maxAttempts = 20; // 10 minutes total (30 seconds * 20)
            const verificationInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                attempts++;
                try {
                    const order = yield this.orderService.getOrder(orderId);
                    if (!order || order.paymentInfo.status !== types_1.PaymentStatus.PENDING) {
                        this.clearVerification(orderId);
                        return;
                    }
                    console.log(`🔍 Verification attempt ${attempts}/${maxAttempts} for order: ${orderId}`);
                    // Verify payment on blockchain
                    const isValid = yield this.blockchainService.validateTransaction(order.paymentInfo.txnHash, order.paymentInfo.network, order.paymentInfo.amount, order.paymentInfo.walletAddress);
                    if (isValid) {
                        // Payment confirmed!
                        yield this.confirmPayment(order, chatId);
                        this.clearVerification(orderId);
                        return;
                    }
                    // If max attempts reached, mark as failed
                    if (attempts >= maxAttempts) {
                        yield this.failPayment(order, chatId);
                        this.clearVerification(orderId);
                    }
                }
                catch (error) {
                    console.error(`❌ Verification error for order ${orderId}:`, error);
                    if (attempts >= maxAttempts) {
                        this.clearVerification(orderId);
                    }
                }
            }), 30000); // Check every 30 seconds
            // Store the interval
            this.verificationIntervals.set(orderId, verificationInterval);
            // Set a maximum timeout of 15 minutes
            setTimeout(() => {
                if (this.verificationIntervals.has(orderId)) {
                    console.log(`⏰ Verification timeout for order: ${orderId}`);
                    this.clearVerification(orderId);
                }
            }, 900000); // 15 minutes
        });
    }
    // Manual verification method (for admin use)
    manualVerifyPayment(orderId, chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.orderService.getOrder(orderId);
                if (!order) {
                    console.log(`❌ Order not found: ${orderId}`);
                    return false;
                }
                if (order.paymentInfo.status !== types_1.PaymentStatus.PENDING) {
                    console.log(`❌ Order ${orderId} is not in PENDING status: ${order.paymentInfo.status}`);
                    return false;
                }
                const isValid = yield this.blockchainService.validateTransaction(order.paymentInfo.txnHash, order.paymentInfo.network, order.paymentInfo.amount, order.paymentInfo.walletAddress);
                if (isValid) {
                    yield this.confirmPayment(order, chatId || 0);
                    this.clearVerification(orderId);
                    return true;
                }
                else {
                    console.log(`❌ Manual verification failed for order: ${orderId}`);
                    return false;
                }
            }
            catch (error) {
                console.error(`❌ Manual verification error for order ${orderId}:`, error);
                return false;
            }
        });
    }
    // Get all pending orders for batch verification
    getAllPendingOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            // This would require adding a method to OrderService
            // For now, we'll assume it exists or implement a simple version
            try {
                // You'll need to add this method to OrderService:
                // async getPendingOrders(): Promise<Order[]>
                return []; // Placeholder - implement in OrderService
            }
            catch (error) {
                console.error("Error fetching pending orders:", error);
                return [];
            }
        });
    }
    // Batch verification for all pending orders
    verifyAllPendingOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("🔄 Starting batch verification of all pending orders...");
            try {
                const pendingOrders = yield this.getAllPendingOrders();
                for (const order of pendingOrders) {
                    if (order._id) {
                        // Convert ObjectId to string if needed
                        const orderId = order._id.toString();
                        // Don't start verification if already running
                        if (!this.verificationIntervals.has(orderId)) {
                            // We don't have chatId for batch, so pass 0 (admin will handle notifications)
                            yield this.startOrderVerification(orderId, 0);
                        }
                    }
                }
                console.log(`✅ Batch verification started for ${pendingOrders.length} orders`);
            }
            catch (error) {
                console.error("❌ Error in batch verification:", error);
            }
        });
    }
    // Stop verification for a specific order
    stopOrderVerification(orderId) {
        this.clearVerification(orderId);
    }
    // Stop all verifications
    stopAllVerifications() {
        console.log("🛑 Stopping all payment verifications...");
        this.verificationIntervals.forEach((interval, orderId) => {
            clearInterval(interval);
            console.log(`⏹️ Stopped verification for order: ${orderId}`);
        });
        this.verificationIntervals.clear();
    }
    // Get verification status
    getVerificationStatus() {
        const orderIds = Array.from(this.verificationIntervals.keys());
        return {
            activeVerifications: orderIds.length,
            orderIds,
        };
    }
    // Confirm payment success
    confirmPayment(order, chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`✅ Payment confirmed for order: ${order._id}`);
            // Update order status
            yield this.orderService.updateOrder(order._id.toString(), {
                paymentInfo: Object.assign(Object.assign({}, order.paymentInfo), { status: types_1.PaymentStatus.CONFIRMED, confirmedAt: new Date() }),
            });
            // Only send notification if chatId is provided and valid
            if (chatId > 0) {
                yield this.sendConfirmationNotification(order, chatId);
            }
        });
    }
    // Mark payment as failed
    failPayment(order, chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`❌ Payment verification failed for order: ${order._id}`);
            // Update order status
            yield this.orderService.updateOrder(order._id.toString(), {
                paymentInfo: Object.assign(Object.assign({}, order.paymentInfo), { status: types_1.PaymentStatus.FAILED, failedAt: new Date() }),
            });
            // Only send notification if chatId is provided and valid
            if (chatId > 0) {
                yield this.sendFailureNotification(order, chatId);
            }
        });
    }
    // Send payment confirmation notification
    sendConfirmationNotification(order, chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const serviceDesc = this.getServiceDescription(order);
            const duration = this.getServiceDuration(order);
            const confirmationMessage = `
🎉 *Payment Confirmed!*

✅ Your payment has been verified on the blockchain!

🆔 **Order ID:** \`${order._id}\`
📱 **Project:** ${order.projectDetails.name}
🛍️ **Service:** ${serviceDesc}
📅 **Duration:** ${duration}
💰 **Amount:** $${order.totalPrice}
🔗 **Network:** ${order.paymentInfo.network.toUpperCase()}
🧾 **Transaction:** \`${order.paymentInfo.txnHash}\`

🚀 **Your service will begin as scheduled!**

Thank you for choosing Risky Business! 🎊
    `;
            try {
                yield this.bot.sendMessage(chatId, confirmationMessage, {
                    parse_mode: "Markdown",
                });
            }
            catch (error) {
                console.error(`Failed to send confirmation to chat ${chatId}:`, error);
            }
        });
    }
    // Send payment failure notification
    sendFailureNotification(order, chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const failureMessage = `
❌ *Payment Verification Failed*

🆔 **Order ID:** \`${order._id}\`
📱 **Project:** ${order.projectDetails.name}
💰 **Expected Amount:** $${order.totalPrice}
🔗 **Network:** ${order.paymentInfo.network.toUpperCase()}
🧾 **Transaction:** \`${order.paymentInfo.txnHash}\`

**Possible Issues:**
• Transaction not confirmed yet (network congestion)
• Wrong amount sent (check for exact USD equivalent)
• Wrong network used (ensure correct blockchain)
• Wrong wallet address
• Insufficient gas fees

**Next Steps:**
• Wait longer if transaction is still pending
• Double-check your transaction on blockchain explorer
• Contact support if you believe this is an error
• Place a new order with correct details

💡 _Contact our support team for assistance_
    `;
            try {
                yield this.bot.sendMessage(chatId, failureMessage, {
                    parse_mode: "Markdown",
                });
            }
            catch (error) {
                console.error(`Failed to send failure notification to chat ${chatId}:`, error);
            }
        });
    }
    // Clear verification interval
    clearVerification(orderId) {
        const interval = this.verificationIntervals.get(orderId);
        if (interval) {
            clearInterval(interval);
            this.verificationIntervals.delete(orderId);
            console.log(`🗑️ Cleared verification for order: ${orderId}`);
        }
    }
    // Helper method to get service description
    getServiceDescription(order) {
        switch (order.serviceConfig.type) {
            case types_1.ServiceType.PIN:
                return `Pin Service (${order.serviceConfig.pinnedPosts || 1} posts)`;
            case types_1.ServiceType.BUYBOT:
                return "BuyBot Service";
            case types_1.ServiceType.COMBO:
                return `Combo Service (${order.serviceConfig.pinnedPosts || 1} pins + BuyBot)`;
            default:
                return "Unknown Service";
        }
    }
    // Helper method to get service duration
    getServiceDuration(order) {
        const startDate = (0, moment_timezone_1.default)(order.serviceConfig.startDate)
            .utc()
            .format("YYYY-MM-DD HH:mm UTC");
        const endDate = (0, moment_timezone_1.default)(order.serviceConfig.endDate)
            .utc()
            .format("YYYY-MM-DD HH:mm UTC");
        return `${startDate} - ${endDate}`;
    }
    // Cleanup method to be called on service shutdown
    cleanup() {
        this.stopAllVerifications();
    }
}
exports.PaymentVerificationService = PaymentVerificationService;
//# sourceMappingURL=PaymentVerificationService.js.map