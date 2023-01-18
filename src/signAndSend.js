"use strict";
// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0
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
exports.signAndSend = void 0;
function signAndSend(api, submittable, _signer, senderAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    console.log('signing and sending a tx ...');
                    // eslint-disable-next-line no-void
                    void submittable.signAndSend(_signer, function (result) { return __awaiter(_this, void 0, void 0, function () {
                        var success, failureText, parsedRes, event, decoded, docs, name_1, section, hash, signedBlock, blockNumber, txHash, fee;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    success = true;
                                    failureText = '';
                                    parsedRes = JSON.parse(JSON.stringify(result));
                                    event = new CustomEvent('transactionState', { detail: parsedRes.status });
                                    window.dispatchEvent(event);
                                    console.log(parsedRes);
                                    if (result.dispatchError) {
                                        if (result.dispatchError.isModule) {
                                            decoded = api.registry.findMetaError(result.dispatchError.asModule);
                                            docs = decoded.docs, name_1 = decoded.name, section = decoded.section;
                                            success = false;
                                            failureText = "".concat(docs.join(' '));
                                            console.log("dispatchError module: ".concat(section, ".").concat(name_1, ": ").concat(docs.join(' ')));
                                        }
                                        else {
                                            // Other, CannotLookup, BadOrigin, no extra info
                                            console.log("dispatchError other reason: ".concat(result.dispatchError.toString()));
                                        }
                                    }
                                    if (!(result.status.isFinalized || result.status.isInBlock)) return [3 /*break*/, 2];
                                    console.log('Tx. Status: ', result.status);
                                    hash = result.status.isFinalized ? result.status.asFinalized : result.status.asInBlock;
                                    return [4 /*yield*/, api.rpc.chain.getBlock(hash)];
                                case 1:
                                    signedBlock = _a.sent();
                                    blockNumber = signedBlock.block.header.number;
                                    txHash = result.txHash.toString();
                                    fee = undefined;
                                    resolve({ block: Number(blockNumber), failureText: failureText, fee: fee, success: success, txHash: txHash });
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); })["catch"](function (e) {
                        console.log('catch error', e);
                        resolve({ block: 0, failureText: String(e), fee: '', success: false, txHash: '' });
                    });
                })];
        });
    });
}
exports.signAndSend = signAndSend;
