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
exports.BlockchainService = void 0;
const web3_1 = __importDefault(require("web3"));
const config_1 = require("../config");
const types_1 = require("../types");
class BlockchainService {
    constructor() {
        this.web3Instances = new Map();
        this.initializeWeb3Instances();
    }
    initializeWeb3Instances() {
        this.web3Instances.set(types_1.BlockchainNetwork.BSC, new web3_1.default(config_1.config.rpcUrls.bsc));
        this.web3Instances.set(types_1.BlockchainNetwork.ETH, new web3_1.default(config_1.config.rpcUrls.ethereum));
        this.web3Instances.set(types_1.BlockchainNetwork.BASE, new web3_1.default(config_1.config.rpcUrls.base));
    }
    getWeb3Instance(network) {
        const web3 = this.web3Instances.get(network);
        if (!web3) {
            throw new Error(`Web3 instance not found for network: ${network}`);
        }
        return web3;
    }
    validateTransaction(txnHash, network, expectedAmount, toAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const web3 = this.getWeb3Instance(network);
                // Basic hash format validation
                if (!this.isValidTxHash(txnHash)) {
                    return false;
                }
                // Get transaction details
                const tx = yield web3.eth.getTransaction(txnHash);
                if (!tx) {
                    return false;
                }
                // Check if transaction is to our wallet
                if (((_a = tx.to) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== toAddress.toLowerCase()) {
                    return false;
                }
                // Get transaction receipt to check status
                const receipt = yield web3.eth.getTransactionReceipt(txnHash);
                if (!receipt || !receipt.status) {
                    return false;
                }
                // For native token transfers, check value
                const valueInEth = parseFloat(web3.utils.fromWei(tx.value.toString(), "ether"));
                // Allow for small variations due to gas and precision
                const tolerance = 0.001; // 0.1% tolerance
                return Math.abs(valueInEth - expectedAmount) <= tolerance;
            }
            catch (error) {
                console.error("Transaction validation error:", error);
                return false;
            }
        });
    }
    isValidTxHash(hash) {
        return /^0x[a-fA-F0-9]{64}$/.test(hash);
    }
    getWalletAddress(network) {
        console.log(network, "The network recieved");
        switch (network) {
            case types_1.BlockchainNetwork.BSC:
                return config_1.config.walletAddresses.bsc;
            case types_1.BlockchainNetwork.ETH:
                return config_1.config.walletAddresses.ethereum;
            case types_1.BlockchainNetwork.BASE:
                return config_1.config.walletAddresses.base;
            default:
                throw new Error(`Unsupported network: ${network}`);
        }
    }
}
exports.BlockchainService = BlockchainService;
//# sourceMappingURL=blockchainService.js.map