"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentStatus = exports.BlockchainNetwork = exports.ServiceType = void 0;
var ServiceType;
(function (ServiceType) {
    ServiceType["PIN"] = "pin";
    ServiceType["BUYBOT"] = "buybot";
    ServiceType["COMBO"] = "combo";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
var BlockchainNetwork;
(function (BlockchainNetwork) {
    BlockchainNetwork["BSC"] = "bsc";
    BlockchainNetwork["ETH"] = "ethereum";
    BlockchainNetwork["BASE"] = "base";
})(BlockchainNetwork || (exports.BlockchainNetwork = BlockchainNetwork = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["CONFIRMED"] = "confirmed";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
//# sourceMappingURL=index.js.map