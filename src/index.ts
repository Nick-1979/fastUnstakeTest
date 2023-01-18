import keyring from '@polkadot/ui-keyring';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { AccountId } from '@polkadot/types/interfaces/runtime';

import type { KeypairType } from '@polkadot/util-crypto/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { signAndSend } from './signAndSend';
// import { selectableNetworks } from '@polkadot/networks';
// const CHAIN = 'westend';
// const genesisHash=selectableNetworks//.find((net)=>net.displayName===CHAIN)?.genesisHash;

const GENESIS_HASH = {
    westend: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    kusama: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
}
const genesisHash = GENESIS_HASH.westend;
const SEED = "sense across win orchard erosion anger mixture film gown machine parrot human";
const WESTEND_ENDPOINT = 'wss://westend-rpc.dwellir.com: ';
const KUSAMA_ENDPOINT = 'wss://kusama-rpc.dwellir.com: ';
const PASSWORD = 'xyz123456';
const MAIN_ACCOUNT_NAME = 'Parent'
const NUMBER_OF_DERIVED_ACCOUNTS = 2;
const TRANSFER_AMOUNT = 0.01; //wnd
const accounts: { master: string | undefined, derived: string[] } = { master: undefined, derived: [] };

const DEFAULT_TYPE: KeypairType = 'sr25519';

async function createAccounts() {
    return new Promise((resolve) => {
        cryptoWaitReady().then(() => {
            keyring.loadAll({ ss58Format: 42, type: DEFAULT_TYPE });

            // console.log( keyring.addUri(SEED, PASSWORD, { genesisHash: genesisHash.kusama, name }, DEFAULT_TYPE)    )
            const { pair, json } = keyring.addUri(SEED, PASSWORD, { name: MAIN_ACCOUNT_NAME });

            accounts.master = json.address;

            //To Derive
            const parentPair = keyring.getPair(accounts.master);
            parentPair.decodePkcs8(PASSWORD);

            for (let i = 0; i < NUMBER_OF_DERIVED_ACCOUNTS; i++) {
                let derivationPath = `//${i}`;
                const derived = parentPair.derive(derivationPath, { genesisHash, name: MAIN_ACCOUNT_NAME, parentAddress: accounts.master, SEED });
                accounts.derived.push(derived.address)
            }

            console.log(`Accounts:`, accounts)

            // keyring.getAddresses().forEach(...)

            resolve(true);
        }).catch((err) => {
            console.error(err);
            resolve(false);
        });
    });
}

async function batchTransfer() {
    const wsProvider = new WsProvider(WESTEND_ENDPOINT);
    const signer = keyring.getPair(accounts.master);
    signer.unlock(PASSWORD);

    const api = await ApiPromise.create({ provider: wsProvider });
    const decimal = api.registry.chainDecimals[0];
    const transfer = api.tx.balances.transferKeepAlive;
    const batchAll = api.tx.utility.batchAll;
    const amountToTransfer = TRANSFER_AMOUNT * 10 ** decimal;
    const calls = accounts.derived.map((a) => transfer(a, amountToTransfer));
    console.log(`Transferring ${amountToTransfer} from ${accounts.master} to ${accounts.derived.length} other derived accounts`);

    const { success, txHash } = await signAndSend(api, batchAll(calls), signer, accounts.master);
    console.log(`The batch transfer success:${success} with hash:${txHash}`);
}

async function main() {
    await createAccounts();
    batchTransfer();
}

main();