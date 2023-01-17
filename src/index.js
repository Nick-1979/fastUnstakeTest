"use strict";
exports.__esModule = true;
var ui_keyring_1 = require("@polkadot/ui-keyring");
var util_crypto_1 = require("@polkadot/util-crypto");
// import { selectableNetworks } from '@polkadot/networks';
// const CHAIN = 'westend';
// const genesisHash=selectableNetworks//.find((net)=>net.displayName===CHAIN)?.genesisHash;
var GENESIS_HASH = {
    westend: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    kusama: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
};
var genesisHash = GENESIS_HASH.westend;
var SEED = "sense across win orchard erosion anger mixture film gown machine parrot human";
var PASSWORD = 'xyz123456';
var name = 'Parent';
var NUMBER_OF_DERIVED_ACCOUNTS = 19;
var accounts = { master: undefined, derived: [] };
var DEFAULT_TYPE = 'sr25519';
(0, util_crypto_1.cryptoWaitReady)().then(function () {
    ui_keyring_1["default"].loadAll({ ss58Format: 42, type: DEFAULT_TYPE });
    // console.log( keyring.addUri(SEED, PASSWORD, { genesisHash: genesisHash.kusama, name }, DEFAULT_TYPE)    )
    var _a = ui_keyring_1["default"].addUri(SEED, PASSWORD, { name: name }), pair = _a.pair, json = _a.json;
    accounts.master = json.address;
    //To Derive
    var parentPair = ui_keyring_1["default"].getPair(accounts.master);
    parentPair.decodePkcs8(PASSWORD);
    for (var i = 0; i < NUMBER_OF_DERIVED_ACCOUNTS; i++) {
        var derivationPath = "//".concat(i);
        var derived = parentPair.derive(derivationPath, { genesisHash: genesisHash, name: name, parentAddress: accounts.master, SEED: SEED });
        accounts.derived.push(derived.address);
    }
    console.log("accounts:", accounts);
    // keyring.getAddresses().forEach(...)
});
