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
exports.MediaHandlerService = void 0;
const config_1 = require("../config");
class MediaHandlerService {
    constructor(bot, adminChannelId) {
        this.bot = bot;
        // Admin channel ID should be in your config
        this.adminChannelId = adminChannelId || config_1.config.adminChannelId || "";
    }
    // Handle media uploads during order process
    handleMediaUpload(msg, userId, orderId, projectName) {
        return __awaiter(this, void 0, void 0, function* () {
            const chatId = msg.chat.id;
            const mediaType = this.getMediaType(msg);
            console.log("We don reach here ooo");
            if (!mediaType) {
                yield this.bot.sendMessage(chatId, "❌ Please send a valid media file (photo, video, animation/GIF, or document).");
                return;
            }
            try {
                // Forward the media to admin channel with context
                yield this.forwardMediaToAdmin(msg, userId, orderId, projectName, mediaType);
                // Confirm receipt to user
                yield this.bot.sendMessage(chatId, `✅ *Media Received!*\n\n` +
                    `📎 **Type:** ${mediaType}\n` +
                    `📱 **Project:** ${projectName || "Unknown"}\n` +
                    `🆔 **Order:** ${orderId || "Pending"}\n\n` +
                    `Your media has been forwarded to our team for processing.`, { parse_mode: "Markdown" });
            }
            catch (error) {
                console.error("Error handling media upload:", error);
                yield this.bot.sendMessage(chatId, "❌ *Error uploading media*\n\n" +
                    "There was an issue processing your media. Please try again or contact support.", { parse_mode: "Markdown" });
            }
        });
    }
    // Forward media to admin channel with context
    forwardMediaToAdmin(msg, userId, orderId, projectName, mediaType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.adminChannelId) {
                console.error("Admin channel ID not configured!");
                return;
            }
            // Create context message
            const contextMessage = `
🎬 *NEW MEDIA UPLOAD*

👤 **User ID:** ${userId}
📱 **Project:** ${projectName || "Unknown"}
🆔 **Order ID:** ${orderId || "Pending"}
📎 **Media Type:** ${mediaType || "Unknown"}
📅 **Time:** ${new Date().toISOString()}

---
    `;
            try {
                // Send context first
                yield this.bot.sendMessage(this.adminChannelId, contextMessage, {
                    parse_mode: "Markdown",
                });
                // Forward the actual media
                yield this.bot.forwardMessage(this.adminChannelId, msg.chat.id, msg.message_id);
            }
            catch (error) {
                console.error("Error forwarding to admin channel:", error);
                throw error;
            }
        });
    }
    // Determine media type from message
    getMediaType(msg) {
        if (msg.photo)
            return "Photo";
        if (msg.video)
            return "Video";
        if (msg.animation)
            return "GIF/Animation";
        if (msg.document) {
            // Check if document is a video/gif
            const mimeType = msg.document.mime_type;
            if (mimeType === null || mimeType === void 0 ? void 0 : mimeType.includes("video"))
                return "Video Document";
            if (mimeType === null || mimeType === void 0 ? void 0 : mimeType.includes("image"))
                return "Image Document";
            return "Document";
        }
        if (msg.video_note)
            return "Video Note";
        return null;
    }
    // Check if message contains media
    hasMedia(msg) {
        console.log("We reached here too ooooo");
        return !!(msg.photo ||
            msg.video ||
            msg.animation ||
            msg.document ||
            msg.video_note);
    }
    // Get media file info for logging
    getMediaInfo(msg) {
        if (msg.photo) {
            const photo = msg.photo[msg.photo.length - 1]; // Get largest photo
            return {
                type: "photo",
                file_id: photo.file_id,
                file_size: photo.file_size,
                width: photo.width,
                height: photo.height,
            };
        }
        if (msg.video) {
            return {
                type: "video",
                file_id: msg.video.file_id,
                file_size: msg.video.file_size,
                duration: msg.video.duration,
                width: msg.video.width,
                height: msg.video.height,
                mime_type: msg.video.mime_type,
            };
        }
        if (msg.animation) {
            return {
                type: "animation",
                file_id: msg.animation.file_id,
                file_size: msg.animation.file_size,
                duration: msg.animation.duration,
                width: msg.animation.width,
                height: msg.animation.height,
                mime_type: msg.animation.mime_type,
            };
        }
        if (msg.document) {
            return {
                type: "document",
                file_id: msg.document.file_id,
                file_size: msg.document.file_size,
                file_name: msg.document.file_name,
                mime_type: msg.document.mime_type,
            };
        }
        return null;
    }
}
exports.MediaHandlerService = MediaHandlerService;
//# sourceMappingURL=MediaHandlerService.js.map