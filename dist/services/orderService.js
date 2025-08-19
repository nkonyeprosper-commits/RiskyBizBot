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
exports.OrderService = void 0;
const connection_1 = require("../database/connection");
const types_1 = require("../types");
const mongodb_1 = require("mongodb");
class OrderService {
    get ordersCollection() {
        return connection_1.database.getDb().collection("orders");
    }
    get sessionsCollection() {
        return connection_1.database.getDb().collection("sessions");
    }
    createOrder(order) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.ordersCollection.insertOne(Object.assign(Object.assign({}, order), { createdAt: new Date(), updatedAt: new Date() }));
            return result.insertedId.toString();
        });
    }
    updateOrder(orderId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ordersCollection.updateOne({ _id: new mongodb_1.ObjectId(orderId) }, {
                $set: Object.assign(Object.assign({}, updates), { updatedAt: new Date() }),
            });
        });
    }
    getOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ordersCollection.findOne({ _id: new mongodb_1.ObjectId(orderId) });
        });
    }
    getUserOrders(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ordersCollection.find({ userId }).toArray();
        });
    }
    saveUserSession(session) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sessionsCollection.replaceOne({ userId: session.userId }, Object.assign(Object.assign({}, session), { createdAt: new Date() }), { upsert: true });
        });
    }
    getUserSession(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sessionsCollection.findOne({ userId });
        });
    }
    clearUserSession(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sessionsCollection.deleteOne({ userId });
        });
    }
    getPendingOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ordersCollection
                .find({
                "paymentInfo.status": types_1.PaymentStatus.PENDING,
            })
                .toArray();
        });
    }
    // Also add this method for admin/monitoring purposes
    getOrdersByStatus(status) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ordersCollection
                .find({
                "paymentInfo.status": status,
            })
                .toArray();
        });
    }
    // Get orders within a date range (useful for monitoring)
    getOrdersByDateRange(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.ordersCollection
                .find({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            })
                .toArray();
        });
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=orderService.js.map