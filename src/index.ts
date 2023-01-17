import keyring from '@polkadot/ui-keyring';
import type { KeypairType } from '@polkadot/util-crypto/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
// import { selectableNetworks } from '@polkadot/networks';
// const CHAIN = 'westend';
// const genesisHash=selectableNetworks//.find((net)=>net.displayName===CHAIN)?.genesisHash;

const GENESIS_HASH = {
    westend: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    kusama: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
}
const genesisHash = GENESIS_HASH.westend;
const SEED = "sense across win orchard erosion anger mixture film gown machine parrot human";
const PASSWORD = 'xyz123456';
const name = 'Parent'
const NUMBER_OF_DERIVED_ACCOUNTS = 19;
const accounts: { master: string | undefined, derived: string[] } = { master: undefined, derived: [] };

const DEFAULT_TYPE: KeypairType = 'sr25519';
cryptoWaitReady().then(() => {
    keyring.loadAll({ ss58Format: 42, type: DEFAULT_TYPE });

    // console.log( keyring.addUri(SEED, PASSWORD, { genesisHash: genesisHash.kusama, name }, DEFAULT_TYPE)    )
    const { pair, json } = keyring.addUri(SEED, PASSWORD, { name });

    accounts.master = json.address;

    //To Derive
    const parentPair = keyring.getPair(accounts.master);
    parentPair.decodePkcs8(PASSWORD);

    for (let i = 0; i < NUMBER_OF_DERIVED_ACCOUNTS; i++) {
        let derivationPath = `//${i}`;
        const derived = parentPair.derive(derivationPath, { genesisHash, name, parentAddress: accounts.master, SEED });
        accounts.derived.push(derived.address)
    }

    console.log(`accounts:`, accounts)

    // keyring.getAddresses().forEach(...)


});
