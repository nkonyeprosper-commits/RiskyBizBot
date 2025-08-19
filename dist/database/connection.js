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
exports.database = void 0;
const mongodb_1 = require("mongodb");
const config_1 = require("../config");
class Database {
    constructor() {
        this.db = null;
        this.client = new mongodb_1.MongoClient(config_1.config.mongoUri);
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.connect();
                this.db = this.client.db();
                console.log("Connected to MongoDB");
            }
            catch (error) {
                console.error("MongoDB connection error:", error);
                throw error;
            }
        });
    }
    getDb() {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        return this.db;
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.close();
        });
    }
}
exports.database = new Database();
//# sourceMappingURL=connection.js.map