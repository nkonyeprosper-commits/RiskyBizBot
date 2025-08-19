"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
const types_1 = require("../types");
const config_1 = require("../config");
class PriceService {
    calculatePrice(serviceType, pinnedPosts) {
        switch (serviceType) {
            case types_1.ServiceType.PIN:
                return (pinnedPosts || 1) * config_1.config.prices.pin;
            case types_1.ServiceType.BUYBOT:
                return config_1.config.prices.buybot;
            case types_1.ServiceType.COMBO:
                return config_1.config.prices.combo;
            default:
                throw new Error(`Unknown service type: ${serviceType}`);
        }
    }
    getServiceDescription(serviceType) {
        switch (serviceType) {
            case types_1.ServiceType.PIN:
                return "Pin Service (48h)";
            case types_1.ServiceType.BUYBOT:
                return "BuyBot Service (48h)";
            case types_1.ServiceType.COMBO:
                return "Combo (Pin + BuyBot, 48h)";
            default:
                return "Unknown Service";
        }
    }
}
exports.PriceService = PriceService;
//# sourceMappingURL=priceService.js.map