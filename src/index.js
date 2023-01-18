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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var ui_keyring_1 = require("@polkadot/ui-keyring");
var api_1 = require("@polkadot/api");
var util_crypto_1 = require("@polkadot/util-crypto");
var signAndSend_1 = require("./signAndSend");
// import { selectableNetworks } from '@polkadot/networks';
// const CHAIN = 'westend';
// const genesisHash=selectableNetworks//.find((net)=>net.displayName===CHAIN)?.genesisHash;
var GENESIS_HASH = {
    westend: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    kusama: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
};
var genesisHash = GENESIS_HASH.westend;
var SEED = "sense across win orchard erosion anger mixture film gown machine parrot human";
var WESTEND_ENDPOINT = 'wss://westend-rpc.dwellir.com: ';
var KUSAMA_ENDPOINT = 'wss://kusama-rpc.dwellir.com: ';
var PASSWORD = 'xyz123456';
var MAIN_ACCOUNT_NAME = 'Parent';
var NUMBER_OF_DERIVED_ACCOUNTS = 2;
var TRANSFER_AMOUNT = 0.01; //wnd
var accounts = { master: undefined, derived: [] };
var DEFAULT_TYPE = 'sr25519';
function createAccounts() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    (0, util_crypto_1.cryptoWaitReady)().then(function () {
                        ui_keyring_1["default"].loadAll({ ss58Format: 42, type: DEFAULT_TYPE });
                        // console.log( keyring.addUri(SEED, PASSWORD, { genesisHash: genesisHash.kusama, name }, DEFAULT_TYPE)    )
                        var _a = ui_keyring_1["default"].addUri(SEED, PASSWORD, { name: MAIN_ACCOUNT_NAME }), pair = _a.pair, json = _a.json;
                        accounts.master = json.address;
                        //To Derive
                        var parentPair = ui_keyring_1["default"].getPair(accounts.master);
                        parentPair.decodePkcs8(PASSWORD);
                        for (var i = 0; i < NUMBER_OF_DERIVED_ACCOUNTS; i++) {
                            var derivationPath = "//".concat(i);
                            var derived = parentPair.derive(derivationPath, { genesisHash: genesisHash, name: MAIN_ACCOUNT_NAME, parentAddress: accounts.master, SEED: SEED });
                            accounts.derived.push(derived.address);
                        }
                        console.log("Accounts:", accounts);
                        // keyring.getAddresses().forEach(...)
                        resolve(true);
                    })["catch"](function (err) {
                        console.error(err);
                        resolve(false);
                    });
                })];
        });
    });
}
function batchTransfer() {
    return __awaiter(this, void 0, void 0, function () {
        var wsProvider, signer, api, decimal, transfer, batchAll, amountToTransfer, calls, _a, success, txHash;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    wsProvider = new api_1.WsProvider(WESTEND_ENDPOINT);
                    signer = ui_keyring_1["default"].getPair(accounts.master);
                    signer.unlock(PASSWORD);
                    return [4 /*yield*/, api_1.ApiPromise.create({ provider: wsProvider })];
                case 1:
                    api = _b.sent();
                    decimal = api.registry.chainDecimals[0];
                    transfer = api.tx.balances.transferKeepAlive;
                    batchAll = api.tx.utility.batchAll;
                    amountToTransfer = TRANSFER_AMOUNT * Math.pow(10, decimal);
                    calls = accounts.derived.map(function (a) { return transfer(a, amountToTransfer); });
                    console.log("Transferring ".concat(amountToTransfer, " from ").concat(accounts.master, " to ").concat(accounts.derived.length, " other derived accounts"));
                    return [4 /*yield*/, (0, signAndSend_1.signAndSend)(api, batchAll(calls), signer, accounts.master)];
                case 2:
                    _a = _b.sent(), success = _a.success, txHash = _a.txHash;
                    console.log("The batch transfer success:".concat(success, " with hash:").concat(txHash));
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createAccounts()];
                case 1:
                    _a.sent();
                    batchTransfer();
                    return [2 /*return*/];
            }
        });
    });
}
main();
