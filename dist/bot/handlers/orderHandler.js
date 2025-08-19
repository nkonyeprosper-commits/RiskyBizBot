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
exports.OrderHandler = void 0;
const keyboards_1 = require("../keyboards");
const types_1 = require("../../types");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const MediaHandlerService_1 = require("../../services/MediaHandlerService");
class OrderHandler {
    constructor(bot, orderService, priceService, blockchainService, paymentVerificationService) {
        this.bot = bot;
        this.orderService = orderService;
        this.priceService = priceService;
        this.blockchainService = blockchainService;
        this.paymentVerificationService = paymentVerificationService;
        this.mediaHandler = new MediaHandlerService_1.MediaHandlerService(this.bot);
    }
    handleStartOrder(chatId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.orderService.clearUserSession(userId);
            yield this.orderService.saveUserSession({
                userId,
                step: "project_name",
                data: {},
                createdAt: new Date(),
            });
            yield this.bot.sendMessage(chatId, "🚀 *Welcome to Risky Business Payment Portal*\n\n" +
                "You'll submit your project details, choose a promotion type, and make payment. Takes about 2 minutes.\n\n" +
                "📝 Let's start with your project name:", { parse_mode: "Markdown" });
        });
    }
    handleTextMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const chatId = msg.chat.id;
            const userId = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.id;
            // Check if message contains media
            if (this.mediaHandler.hasMedia(msg)) {
                yield this.handleMediaCallback(msg);
                return;
            }
            const text = msg.text;
            const session = yield this.orderService.getUserSession(userId);
            if (!session)
                return;
            switch (session.step) {
                case "project_name":
                    yield this.handleProjectName(chatId, userId, text, session);
                    break;
                case "social_link":
                    yield this.handleSocialLink(chatId, userId, text, session);
                    break;
                case "contract_address":
                    yield this.handleContractAddress(chatId, userId, text, session);
                    break;
                case "project_description":
                    yield this.handleProjectDescription(chatId, userId, text, session);
                    break;
                case "pinned_posts":
                    yield this.handlePinnedPosts(chatId, userId, text, session);
                    break;
                case "start_date":
                    yield this.handleStartDate(chatId, userId, text, session);
                    break;
                case "end_date":
                    yield this.handleEndDate(chatId, userId, text, session);
                    break;
                case "txn_hash":
                    yield this.handleTransactionHash(chatId, userId, text, session);
                    break;
                case "media_upload":
                    yield this.showMediaUploadInstructions(chatId, session);
                    break;
            }
        });
    }
    handleMediaCallback(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const chatId = msg.chat.id;
            const userId = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.id;
            const session = yield this.orderService.getUserSession(userId);
            if (!session) {
                // No active session, just acknowledge
                yield this.bot.sendMessage(chatId, "📎 I received your media, but you don't have an active order session.\n\n" +
                    "Please start a new order first with /start");
                return;
            }
            // If we're in media_upload step, process it
            if (session.step === "media_upload") {
                yield this.handleMediaUploadStep(msg, session);
                return;
            }
            // For other steps, inform user
            yield this.bot.sendMessage(chatId, "📎 Media received! I'll save this for your order.\n\n" +
                "Continue with the current step to proceed.");
            // Forward media anyway with current session context
            yield this.mediaHandler.handleMediaUpload(msg, userId, session.data.orderId, session.data.projectName);
        });
    }
    showMediaUploadInstructions(chatId, session) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bot.sendMessage(chatId, "🎬 *Upload Media for Your Service*\n\n" +
                "📎 **Please upload:**\n" +
                "• 📸 Photo/Image for posts\n" +
                "• 🎥 Video content\n" +
                "• 🎞️ GIF/Animation\n\n" +
                "💡 **Tips:**\n" +
                "• High quality works best\n" +
                "• Max file size: 50MB\n" +
                "• Multiple files? Send them one by one\n\n" +
                "Or click continue to skip media:", {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "✅ Continue Without Media",
                                callback_data: "media_done",
                            },
                        ],
                        [{ text: "❌ Cancel Order", callback_data: "cancel_order" }],
                    ],
                },
            });
        });
    }
    // New: Handle media upload step
    handleMediaUploadStep(msgOrChatId, sessionOrUserId, session) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let chatId;
            let userId;
            let actualSession;
            let msg;
            console.log("msgOrChatId type:", typeof msgOrChatId);
            console.log("msgOrChatId value:", msgOrChatId);
            // ✅ FIXED: Check if first parameter is a Message object
            if (msgOrChatId &&
                typeof msgOrChatId === "object" &&
                "chat" in msgOrChatId) {
                // Called with (msg, session) from handleMediaCallback
                msg = msgOrChatId;
                chatId = msg.chat.id;
                userId = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.id;
                actualSession = sessionOrUserId; // This is the session
                console.log("✅ Message branch - media upload");
            }
            else if (typeof msgOrChatId === "number") {
                // Called with (chatId, userId, session) from switch statement
                chatId = msgOrChatId;
                userId = sessionOrUserId;
                actualSession = session;
                console.log("✅ Number branch - text instruction");
            }
            else {
                console.error("❌ Invalid parameters passed to handleMediaUploadStep");
                return;
            }
            // If it's just a text message in media step, show instructions
            if (!msg || !this.mediaHandler.hasMedia(msg)) {
                yield this.bot.sendMessage(chatId, "🎬 *Upload Media for Your Service*\n\n" +
                    "📎 **Please upload:**\n" +
                    "• 📸 Photo/Image for posts\n" +
                    "• 🎥 Video content\n" +
                    "• 🎞️ GIF/Animation\n\n" +
                    "💡 **Tips:**\n" +
                    "• High quality works best\n" +
                    "• Max file size: 50MB\n" +
                    "• Multiple files? Send them one by one\n\n" +
                    "Or type 'skip' to continue without media:", { parse_mode: "Markdown" });
                return;
            }
            console.log("What happened next");
            // Process the media
            yield this.mediaHandler.handleMediaUpload(msg, userId, actualSession.data.orderId, actualSession.data.projectName);
            console.log("We are still waiting");
            // Ask if they want to upload more
            yield this.bot.sendMessage(chatId, "✅ *Media uploaded successfully!*\n\n" +
                "Would you like to upload more media or continue?", {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "📎 Upload More", callback_data: "media_more" },
                            { text: "✅ Continue", callback_data: "media_done" },
                        ],
                        [{ text: "❌ Cancel Order", callback_data: "cancel_order" }],
                    ],
                },
            });
        });
    }
    handleCancel(chatId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.orderService.clearUserSession(userId);
            yield this.bot.sendMessage(chatId, "❌ *Order Cancelled*\n\nYour current order has been cancelled. You can start a new order anytime!", {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getMainMenuKeyboard(),
            });
        });
    }
    handleProjectName(chatId, userId, text, session) {
        return __awaiter(this, void 0, void 0, function* () {
            session.data.projectName = text;
            session.step = "social_links";
            // Initialize socialLinks if not exists
            if (!session.data.socialLinks) {
                session.data.socialLinks = {};
            }
            yield this.orderService.saveUserSession(session);
            const messageText = this.getSocialLinksMessage(session.data.socialLinks);
            const sentMessage = yield this.bot.sendMessage(chatId, messageText, {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getSocialPlatformsKeyboard(session.data.socialLinks),
            });
            // ✅ Store the message ID for later editing
            session.data.lastMessageId = sentMessage.message_id;
            yield this.orderService.saveUserSession(session);
        });
    }
    handleCallbackQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const chatId = (_a = query.message) === null || _a === void 0 ? void 0 : _a.chat.id;
            const userId = query.from.id;
            const data = query.data;
            // Handle media callbacks
            if (data === "media_more") {
                yield this.bot.answerCallbackQuery(query.id, {
                    text: "Upload more media files",
                });
                const session = yield this.orderService.getUserSession(userId);
                if (session) {
                    yield this.handleMediaUploadStep(chatId, userId, session);
                }
                return;
            }
            if (data === "media_done") {
                yield this.bot.answerCallbackQuery(query.id, {
                    text: "Proceeding to next step",
                });
                const session = yield this.orderService.getUserSession(userId);
                if (session) {
                    yield this.proceedToDateSelection(chatId, userId, session);
                }
                return;
            }
            if (data === "start_order") {
                yield this.handleStartOrder(chatId, userId);
                return;
            }
            if (data === "cancel_order") {
                yield this.handleCancel(chatId, userId);
                return;
            }
            const session = yield this.orderService.getUserSession(userId);
            if (!session)
                return;
            if (data.startsWith("social_")) {
                yield this.handleSocialCallback(chatId, userId, data, session);
            }
            else if (data.startsWith("blockchain_")) {
                yield this.handleBlockchainCallback(chatId, userId, data, session);
            }
            else if (data.startsWith("service_")) {
                yield this.handleServiceCallback(chatId, userId, data, session);
            }
            else if (data.startsWith("payment_") && data !== "payment_confirm") {
                // 🔧 FIX: Only handle network selection, not confirmation
                yield this.handlePaymentCallback(chatId, userId, data, session);
            }
            else if (data === "payment_confirm") {
                // 🔧 FIX: Separate handler for payment confirmation
                yield this.handlePaymentConfirm(chatId, userId, session);
            }
            else if (data.startsWith("date_")) {
                yield this.handleDateCallback(chatId, userId, data, session);
            }
        });
    }
    handleSocialCallback(chatId, userId, data, session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!session.data.socialLinks) {
                session.data.socialLinks = {};
            }
            const platform = data.replace("social_", "");
            if (platform === "done") {
                session.step = "contract_address";
                yield this.orderService.saveUserSession(session);
                yield this.bot.sendMessage(chatId, "📄 *Contract Address & Blockchain*\n\nPlease enter your contract address:", {
                    parse_mode: "Markdown",
                });
                return;
            }
            session.data.currentSocial = platform;
            session.step = "social_link";
            yield this.orderService.saveUserSession(session);
            yield this.bot.sendMessage(chatId, `🔗 Enter your ${platform.charAt(0).toUpperCase() + platform.slice(1)} link:`, { parse_mode: "Markdown" });
        });
    }
    getSocialLinksMessage(socialLinks = {}) {
        const added = Object.keys(socialLinks).filter((key) => socialLinks[key]);
        if (added.length === 0) {
            return "🔗 *Social Links*\n\nAdd your social media links by clicking the buttons below:";
        }
        const addedText = added
            .map((platform) => platform.charAt(0).toUpperCase() + platform.slice(1))
            .join(", ");
        const remaining = ["Twitter", "Telegram", "Discord", "Website"].filter((platform) => !socialLinks[platform.toLowerCase()]);
        if (remaining.length === 0) {
            return `🔗 *Social Links*\n\n✅ Added: ${addedText}\n\nGreat! You can add more or continue:`;
        }
        const remainingText = remaining.slice(0, 2).join(" or ");
        return `🔗 *Social Links*\n\n✅ Added: ${addedText}\n\nNow add ${remainingText} or continue:`;
    }
    handleSocialLink(chatId, userId, text, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const platform = session.data.currentSocial;
            session.data.socialLinks[platform] = text;
            session.step = "social_links";
            yield this.orderService.saveUserSession(session);
            // Edit the existing message with updated info
            const messageText = this.getSocialLinksMessage(session.data.socialLinks);
            try {
                yield this.bot.editMessageText(messageText, {
                    chat_id: chatId,
                    message_id: session.data.lastMessageId,
                    parse_mode: "Markdown",
                    reply_markup: keyboards_1.KeyboardService.getSocialPlatformsKeyboard(session.data.socialLinks),
                });
            }
            catch (error) {
                // Fallback if editing fails
                const sentMessage = yield this.bot.sendMessage(chatId, messageText, {
                    parse_mode: "Markdown",
                    reply_markup: keyboards_1.KeyboardService.getSocialPlatformsKeyboard(session.data.socialLinks),
                });
                session.data.lastMessageId = sentMessage.message_id;
                yield this.orderService.saveUserSession(session);
            }
        });
    }
    handleContractAddress(chatId, userId, text, session) {
        return __awaiter(this, void 0, void 0, function* () {
            session.data.contractAddress = text;
            session.step = "blockchain_selection";
            yield this.orderService.saveUserSession(session);
            yield this.bot.sendMessage(chatId, "⛓️ *Select Blockchain Network:*", {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getBlockchainKeyboard(),
            });
        });
    }
    handleBlockchainCallback(chatId, userId, data, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockchain = data.replace("blockchain_", "");
            session.data.blockchain = blockchain;
            session.step = "project_description";
            yield this.orderService.saveUserSession(session);
            yield this.bot.sendMessage(chatId, '📝 *Project Description (Optional)*\n\nProvide a short description of your project or type "skip":', {
                parse_mode: "Markdown",
            });
        });
    }
    handleProjectDescription(chatId, userId, text, session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (text.toLowerCase() !== "skip") {
                session.data.projectDescription = text;
            }
            session.step = "service_selection";
            yield this.orderService.saveUserSession(session);
            yield this.bot.sendMessage(chatId, "🛍️ *Choose Your Service:*", {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getServiceTypeKeyboard(),
            });
        });
    }
    handleServiceCallback(chatId, userId, data, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const serviceType = data.replace("service_", "");
            session.data.serviceType = serviceType;
            if (serviceType === types_1.ServiceType.PIN || serviceType === types_1.ServiceType.COMBO) {
                session.step = "pinned_posts";
                yield this.orderService.saveUserSession(session);
                yield this.bot.sendMessage(chatId, "📌 *Number of Pinned Posts*\n\nHow many posts would you like to pin? (Enter a number):", {
                    parse_mode: "Markdown",
                });
            }
            else {
                // await this.proceedToDateSelection(chatId, userId, session);
                // Go to media upload step
                session.step = "media_upload";
                yield this.orderService.saveUserSession(session);
                yield this.handleMediaUploadStep(chatId, userId, session);
            }
        });
    }
    handlePinnedPosts(chatId, userId, text, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const posts = parseInt(text);
            if (isNaN(posts) || posts < 1) {
                yield this.bot.sendMessage(chatId, "❌ Please enter a valid number of posts (minimum 1).");
                return;
            }
            // session.data.pinnedPosts = posts;
            // await this.orderService.saveUserSession(session);
            // await this.proceedToDateSelection(chatId, userId, session);
            session.data.pinnedPosts = posts;
            session.step = "media_upload";
            yield this.orderService.saveUserSession(session);
            yield this.handleMediaUploadStep(chatId, userId, session);
        });
    }
    proceedToDateSelection(chatId, userId, session) {
        return __awaiter(this, void 0, void 0, function* () {
            session.step = "start_date";
            yield this.orderService.saveUserSession(session);
            yield this.bot.sendMessage(chatId, "📅 *Start Date & Time*\n\n" +
                "Choose an option or enter manually:\n" +
                "• Use ASAP for immediate start\n" +
                "• Use format: YYYY-MM-DD HH:MM\n" +
                "• Example: 2025-08-16 14:30\n\n" +
                "_All times in UTC timezone_", {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getDateSelectionKeyboard(),
            });
        });
    }
    handleDateCallback(chatId, userId, data, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const action = data.replace("date_", "");
            if (action === "asap") {
                // Set start date to now + 30 minutes
                const startDate = moment_timezone_1.default.utc().add(30, "minutes");
                session.data.startDate = startDate.toDate();
                session.step = "end_date";
                yield this.orderService.saveUserSession(session);
                yield this.bot.sendMessage(chatId, `✅ *Start Date Set*\n📅 ${startDate.format("YYYY-MM-DD HH:mm UTC")}\n\n` +
                    "📅 *End Date & Time*\n\n" +
                    "Choose an option or enter manually:\n" +
                    "• Use format: YYYY-MM-DD HH:MM\n" +
                    "• Example: 2025-08-18 14:30\n\n" +
                    "_All times in UTC timezone_", {
                    parse_mode: "Markdown",
                    reply_markup: keyboards_1.KeyboardService.getEndDateKeyboard(startDate.toDate()),
                });
            }
            else if (action === "manual") {
                yield this.bot.sendMessage(chatId, "📅 *Enter Start Date*\n\n" +
                    "Please enter start date and time:\n" +
                    "Format: YYYY-MM-DD HH:MM\n" +
                    "Example: 2025-08-16 14:30\n\n" +
                    "_Time in UTC timezone_", { parse_mode: "Markdown" });
            }
            else if (action.startsWith("hours_")) {
                // Handle end date selection (24h, 48h options)
                const hours = parseInt(action.replace("hours_", ""));
                const startDate = (0, moment_timezone_1.default)(session.data.startDate);
                const endDate = startDate.clone().add(hours, "hours");
                session.data.endDate = endDate.toDate();
                yield this.orderService.saveUserSession(session);
                yield this.showOrderSummary(chatId, userId, session);
            }
        });
    }
    handleStartDate(chatId, userId, text, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const startDate = moment_timezone_1.default.utc(text, "YYYY-MM-DD HH:mm");
            if (!startDate.isValid()) {
                yield this.bot.sendMessage(chatId, "❌ Invalid date format. Please use YYYY-MM-DD HH:MM\n" +
                    "Example: 2025-08-16 14:30\n\n" +
                    "Or use /cancel to start over");
                return;
            }
            // Check if date is in the future
            if (startDate.isBefore(moment_timezone_1.default.utc())) {
                yield this.bot.sendMessage(chatId, "❌ Start date must be in the future.\n" +
                    "Please enter a future date and time.\n\n" +
                    "Or use /cancel to start over");
                return;
            }
            session.data.startDate = startDate.toDate();
            session.step = "end_date";
            yield this.orderService.saveUserSession(session);
            yield this.bot.sendMessage(chatId, `✅ *Start Date Set*\n📅 ${startDate.format("YYYY-MM-DD HH:mm UTC")}\n\n` +
                "📅 *End Date & Time*\n\n" +
                "Choose duration or enter manually:", {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getEndDateKeyboard(startDate.toDate()),
            });
        });
    }
    handleEndDate(chatId, userId, text, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const endDate = moment_timezone_1.default.utc(text, "YYYY-MM-DD HH:mm");
            if (!endDate.isValid()) {
                yield this.bot.sendMessage(chatId, "❌ Invalid date format. Please use YYYY-MM-DD HH:MM\n" +
                    "Example: 2025-08-18 14:30\n\n" +
                    "Or use /cancel to start over");
                return;
            }
            const startDate = (0, moment_timezone_1.default)(session.data.startDate);
            if (endDate.isBefore(startDate)) {
                yield this.bot.sendMessage(chatId, "❌ End date must be after start date.\n" +
                    "Please enter a valid end date.\n\n" +
                    "Or use /cancel to start over");
                return;
            }
            // Check minimum duration (at least 1 hour)
            if (endDate.diff(startDate, "hours") < 1) {
                yield this.bot.sendMessage(chatId, "❌ Service duration must be at least 1 hour.\n" +
                    "Please enter a later end date.\n\n" +
                    "Or use /cancel to start over");
                return;
            }
            session.data.endDate = endDate.toDate();
            yield this.orderService.saveUserSession(session);
            yield this.showOrderSummary(chatId, userId, session);
        });
    }
    showOrderSummary(chatId, userId, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const price = this.priceService.calculatePrice(session.data.serviceType, session.data.pinnedPosts);
            const serviceDesc = this.priceService.getServiceDescription(session.data.serviceType);
            const summary = `
🧾 *Order Summary*

📱 **Project:** ${session.data.projectName}
⛓️ **Blockchain:** ${session.data.blockchain.toUpperCase()}
📄 **Contract:** \`${session.data.contractAddress}\`
🛍️ **Service:** ${serviceDesc}
${session.data.pinnedPosts
                ? `📌 **Pinned Posts:** ${session.data.pinnedPosts}\n`
                : ""}
📅 **Start:** ${(0, moment_timezone_1.default)(session.data.startDate)
                .utc()
                .format("YYYY-MM-DD HH:mm UTC")}
📅 **End:** ${(0, moment_timezone_1.default)(session.data.endDate).utc().format("YYYY-MM-DD HH:mm UTC")}

💰 **Total Price:** $${price}

Select payment network:
    `;
            session.step = "payment_network";
            yield this.orderService.saveUserSession(session);
            yield this.bot.sendMessage(chatId, summary, {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getPaymentNetworkKeyboard(),
            });
        });
    }
    handlePaymentCallback(chatId, userId, data, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const paymentNetwork = data.replace("payment_", "");
            // Store the selected network in session
            session.data.paymentNetwork = paymentNetwork;
            session.step = "payment_confirmation";
            yield this.orderService.saveUserSession(session);
            const price = this.priceService.calculatePrice(session.data.serviceType, session.data.pinnedPosts);
            const walletAddress = this.blockchainService.getWalletAddress(paymentNetwork);
            const paymentMessage = `
💳 *Payment Instructions*

🔗 **Network:** ${paymentNetwork.toUpperCase()}
💰 **Amount:** $${price} (equivalent in native token)
📍 **Wallet Address:**
\`${walletAddress}\`

⚠️ **Important:**
• Send the equivalent amount in native token (BNB/ETH)
• CEX transfers are supported
• Include sufficient gas fees
• Double-check the wallet address

After sending, click "I've Paid" and enter your transaction hash.

💡 _Use /cancel to start over if needed_
    `;
            yield this.bot.sendMessage(chatId, paymentMessage, {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getConfirmationKeyboard(),
            });
        });
    }
    handlePaymentConfirm(chatId, userId, session) {
        return __awaiter(this, void 0, void 0, function* () {
            session.step = "txn_hash";
            yield this.orderService.saveUserSession(session);
            yield this.bot.sendMessage(chatId, "🧾 *Transaction Hash*\n\n" +
                "Please enter your transaction hash (0x...):\n\n" +
                "💡 _Use /cancel to start over if needed_", { parse_mode: "Markdown" });
        });
    }
    handleTransactionHash(chatId, userId, text, session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.blockchainService.isValidTxHash(text)) {
                yield this.bot.sendMessage(chatId, "❌ Invalid transaction hash format. Please enter a valid hash starting with 0x...\n\n" +
                    "💡 _Use /cancel to start over if needed_");
                return;
            }
            yield this.bot.sendMessage(chatId, "⏳ *Processing Payment...*\n\n" +
                "Please wait while we verify your transaction.\n" +
                "This may take a few moments.");
            try {
                // Create order and start automatic verification
                const orderId = yield this.createOrderFromSession(userId, session, text);
                // Clear session
                yield this.orderService.clearUserSession(userId);
                // Start automatic verification process (deprecated)
                // await this.startAutomaticVerification(orderId, chatId);
                // Send initial confirmation
                yield this.sendOrderConfirmation(chatId, userId, orderId);
                // Start automatic verification using the dedicated service
                yield this.paymentVerificationService.startOrderVerification(orderId, chatId);
            }
            catch (error) {
                console.error("Order creation error:", error);
                yield this.bot.sendMessage(chatId, "❌ *Error Processing Order*\n\n" +
                    "There was an error processing your order. Please try again.\n\n" +
                    "💡 _Use /start to begin a new order_");
            }
        });
    }
    // 🚀 NEW: Automatic payment verification
    startAutomaticVerification(orderId, chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderService.getOrder(orderId);
            if (!order)
                return;
            // Send initial confirmation
            yield this.sendOrderConfirmation(chatId, order.userId, orderId);
            // Start verification process (check every 30 seconds for 10 minutes)
            let attempts = 0;
            const maxAttempts = 20; // 10 minutes total
            const verificationInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                attempts++;
                try {
                    const currentOrder = yield this.orderService.getOrder(orderId);
                    if (!currentOrder ||
                        currentOrder.paymentInfo.status !== types_1.PaymentStatus.PENDING) {
                        clearInterval(verificationInterval);
                        return;
                    }
                    // Verify payment
                    const isValid = yield this.blockchainService.validateTransaction(currentOrder.paymentInfo.txnHash, currentOrder.paymentInfo.network, currentOrder.paymentInfo.amount, currentOrder.paymentInfo.walletAddress);
                    if (isValid) {
                        // Payment confirmed!
                        yield this.orderService.updateOrder(orderId, {
                            paymentInfo: Object.assign(Object.assign({}, currentOrder.paymentInfo), { status: types_1.PaymentStatus.CONFIRMED }),
                        });
                        yield this.sendPaymentConfirmation(chatId, currentOrder);
                        clearInterval(verificationInterval);
                        return;
                    }
                    // If max attempts reached, mark as failed
                    if (attempts >= maxAttempts) {
                        yield this.orderService.updateOrder(orderId, {
                            paymentInfo: Object.assign(Object.assign({}, currentOrder.paymentInfo), { status: types_1.PaymentStatus.FAILED }),
                        });
                        yield this.sendPaymentFailure(chatId, currentOrder);
                        clearInterval(verificationInterval);
                    }
                }
                catch (error) {
                    console.error("Verification error:", error);
                    if (attempts >= maxAttempts) {
                        clearInterval(verificationInterval);
                    }
                }
            }), 30000); // Check every 30 seconds
        });
    }
    sendPaymentConfirmation(chatId, order) {
        return __awaiter(this, void 0, void 0, function* () {
            const serviceDesc = this.priceService.getServiceDescription(order.serviceConfig.type);
            const startDate = (0, moment_timezone_1.default)(order.serviceConfig.startDate)
                .utc()
                .format("YYYY-MM-DD HH:mm UTC");
            const endDate = (0, moment_timezone_1.default)(order.serviceConfig.endDate)
                .utc()
                .format("YYYY-MM-DD HH:mm UTC");
            const confirmationMessage = `
🎉 *Payment Confirmed!*

✅ Your payment has been verified on the blockchain!

🆔 **Order ID:** \`${order._id}\`
📱 **Project:** ${order.projectDetails.name}
🛍️ **Service:** ${serviceDesc}
📅 **Duration:** ${startDate} - ${endDate}
💰 **Amount:** $${order.totalPrice}
🧾 **Transaction:** \`${order.paymentInfo.txnHash}\`

🚀 **Your service will begin as scheduled!**

Thank you for using Risky Business! 🎊
  `;
            yield this.bot.sendMessage(chatId, confirmationMessage, {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getMainMenuKeyboard(),
            });
        });
    }
    sendPaymentFailure(chatId, order) {
        return __awaiter(this, void 0, void 0, function* () {
            const failureMessage = `
❌ *Payment Verification Failed*

🆔 **Order ID:** \`${order._id}\`
🧾 **Transaction:** \`${order.paymentInfo.txnHash}\`

**Possible Issues:**
• Transaction not confirmed yet (wait longer)
• Wrong network used
• Insufficient amount sent
• Wrong wallet address

**Next Steps:**
• Double-check your transaction on blockchain explorer
• Contact support if you believe this is an error
• You can place a new order with correct details

💡 _Use /start to begin a new order_
  `;
            yield this.bot.sendMessage(chatId, failureMessage, {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getMainMenuKeyboard(),
            });
        });
    }
    createOrderFromSession(userId, session, txnHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const price = this.priceService.calculatePrice(session.data.serviceType, session.data.pinnedPosts);
            const walletAddress = this.blockchainService.getWalletAddress(session.data.paymentNetwork);
            const order = {
                userId,
                username: session.data.username,
                projectDetails: {
                    name: session.data.projectName,
                    socialLinks: session.data.socialLinks || {},
                    contractAddress: session.data.contractAddress,
                    blockchain: session.data.blockchain,
                    description: session.data.projectDescription,
                },
                serviceConfig: {
                    type: session.data.serviceType,
                    startDate: session.data.startDate,
                    endDate: session.data.endDate,
                    pinnedPosts: session.data.pinnedPosts,
                },
                paymentInfo: {
                    network: session.data.paymentNetwork,
                    amount: price,
                    walletAddress,
                    txnHash,
                    status: types_1.PaymentStatus.PENDING,
                },
                totalPrice: price,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            return yield this.orderService.createOrder(order);
        });
    }
    sendOrderConfirmation(chatId, userId, orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderService.getOrder(orderId);
            if (!order)
                return;
            const serviceDesc = this.priceService.getServiceDescription(order.serviceConfig.type);
            const startDate = (0, moment_timezone_1.default)(order.serviceConfig.startDate)
                .utc()
                .format("YYYY-MM-DD HH:mm UTC");
            const endDate = (0, moment_timezone_1.default)(order.serviceConfig.endDate)
                .utc()
                .format("YYYY-MM-DD HH:mm UTC");
            const confirmationMessage = `
✅ *Order Confirmed*

🆔 **Order ID:** \`${orderId}\`
📱 **Project:** ${order.projectDetails.name}
⛓️ **Blockchain:** ${order.projectDetails.blockchain.toUpperCase()}
📄 **Contract:** \`${order.projectDetails.contractAddress}\`
🛍️ **Service:** ${serviceDesc}
${order.serviceConfig.pinnedPosts
                ? `📌 **Pinned Posts:** ${order.serviceConfig.pinnedPosts}\n`
                : ""}
📅 **Duration:** ${startDate} - ${endDate}
💰 **Amount Paid:** ${order.totalPrice}
🔗 **Payment Network:** ${order.paymentInfo.network.toUpperCase()}
🧾 **Transaction:** \`${order.paymentInfo.txnHash}\`

⏳ **Status:** Payment verification in progress
📧 We'll notify you once payment is confirmed and service begins.

Thank you for using Risky Business! 🚀
    `;
            yield this.bot.sendMessage(chatId, confirmationMessage, {
                parse_mode: "Markdown",
                reply_markup: keyboards_1.KeyboardService.getMainMenuKeyboard(),
            });
        });
    }
}
exports.OrderHandler = OrderHandler;
//# sourceMappingURL=orderHandler.js.map