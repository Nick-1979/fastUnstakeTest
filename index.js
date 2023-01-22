import keyring from '@polkadot/ui-keyring';
import { ApiPromise, WsProvider } from '@polkadot/api';

import { cryptoWaitReady } from '@polkadot/util-crypto';
import { signAndSend } from './src/signAndSend.mjs';
import { send } from './src/send.mjs';
// import { selectableNetworks } from '@polkadot/networks';
// const CHAIN = 'westend';
// const genesisHash=selectableNetworks//.find((net)=>net.displayName===CHAIN)?.genesisHash;

const GENESIS_HASH = {
    westend: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    kusama: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
}
const genesisHash = GENESIS_HASH.westend;
const SEED = "dose remind defy obvious chaos recall fish upset begin merit auto huge";
const WESTEND_ENDPOINT = 'wss://westend-rpc.dwellir.com: ';
const KUSAMA_ENDPOINT = 'wss://kusama-rpc.dwellir.com: ';
const PASSWORD = 'xyz123456';
const MAIN_ACCOUNT_NAME = 'Parent'
const NUMBER_OF_DERIVED_ACCOUNTS = 2;
const TRANSFER_AMOUNT = 1.2; //wnd

const DEFAULT_TYPE = 'sr25519';

async function createAccounts() {
    return new Promise((resolve) => {
        const accounts = { parent: undefined, derived: [] };

        cryptoWaitReady().then(() => {
            keyring.loadAll({ ss58Format: 42, type: DEFAULT_TYPE });

            // console.log( keyring.addUri(SEED, PASSWORD, { genesisHash: genesisHash.kusama, name }, DEFAULT_TYPE)    )
            const { pair, json } = keyring.addUri(SEED, PASSWORD, { name: MAIN_ACCOUNT_NAME });

            accounts.parent = json.address;

            //To Derive
            const parentPair = keyring.getPair(accounts.parent);
            parentPair.decodePkcs8(PASSWORD);

            console.log(`🆕 Creating ${NUMBER_OF_DERIVED_ACCOUNTS + 1} accounts ...`);

            for (let i = 0; i < NUMBER_OF_DERIVED_ACCOUNTS; i++) {
                let derivationPath = `//${i}`;
                const derived = parentPair.derive(derivationPath, { genesisHash, name: MAIN_ACCOUNT_NAME, parentAddress: accounts.parent, SEED });
                keyring.addPair(derived, PASSWORD);

                accounts.derived.push(derived.address)
            }

            console.log(`Accounts:`, accounts)

            // keyring.getAddresses().forEach(...)

            resolve(accounts);
        }).catch((err) => {
            console.error(err);
            resolve(null);
        });
    });
}

async function batchTransfer(accounts, api) {
    return new Promise((resolve) => {
        const signer = keyring.getPair(accounts.parent);
        signer.unlock(PASSWORD);

        const decimal = api.registry.chainDecimals[0];
        const transfer = api.tx.balances.transferKeepAlive;
        const batchAll = api.tx.utility.batchAll;
        const amountToTransfer = TRANSFER_AMOUNT * 10 ** decimal;
        const calls = accounts.derived.map((a) => transfer(a, amountToTransfer));
        console.log(`↗ Transferring ${amountToTransfer} from ${accounts.parent} to ${accounts.derived.length} other derived accounts`);

        signAndSend(api, batchAll(calls), signer, accounts.parent).then(({ success, txHash }) => {
            console.log(` 🆗 The batch transfer success:${success} with hash:${txHash}`);
            resolve(success);
        });
    });
}

async function batchStake(accounts, api) {
    // const { hash } = await api.rpc.chain.getHeader();
    const minNominatorBond = await api.query.staking.minNominatorBond();

    // const options = { signer: new RawSigner() };
    const options = {};
    const bond = api.tx.staking.bond;
    const batchAll = api.tx.utility.batchAll;

    console.log(`ℹ Staking ${minNominatorBond} for ${accounts.derived.length} accounts as a batch`);

    const signedCalls = await Promise.all(accounts.derived.map(async (a) => { //ُTODO: add parent too
        const signer = keyring.getPair(a);
        signer.unlock(PASSWORD);

        options.nonce = (await api.derive.balances.account(a)).accountNonce;
        options.blockHash = api.genesisHash;
        options.era = 0;

        return await bond(a, minNominatorBond, 'Staked').signAsync(signer, options);
    }));

    const results = await Promise.all(signedCalls.map((c) => send(api, c)));
    // const { success, txHash } = await send(api, signedCalls[0]);

    console.log('🏁 Staking results:',results);
}

async function main() {
    const wsProvider = new WsProvider(WESTEND_ENDPOINT);

    console.log('⌛ waiting for api to be connected ...');
    const api = await ApiPromise.create({ provider: wsProvider });
    console.log('💹 api is connected.');

    const accounts = await createAccounts();
    const success = await batchTransfer(accounts, api);
    batchStake(accounts, api);
}

main();