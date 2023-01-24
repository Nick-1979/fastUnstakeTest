import keyring from '@polkadot/ui-keyring';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { signAndSend } from './src/signAndSend.mjs';
import { send } from './src/send.mjs';

/** settings that should be set before run */
const NUMBER_OF_DERIVED_ACCOUNTS = 64;
const TRANSFER_AMOUNT = 0.04; // > 3*fee+ED+fastUnstakeDeposit  TOKEN
const TEST_CHAIN = 'kusama';
/**************************/

const GENESIS_HASH = {
    westend: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    kusama: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
}

const SS58_FORMAT = {
    kusama: 2,
    westend: 42
};
const ENDPOINT = {
    westend: 'wss://westend-rpc.dwellir.com',
    kusama: 'wss://kusama-rpc.dwellir.com: '
}

const SEED = "draw omit rotate bird illegal leg bulk pool poet print rail brother";
const PASSWORD = 'xyz123456';
const MAIN_ACCOUNT_NAME = 'Parent'
const DEFAULT_TYPE = 'sr25519';
const genesisHash = GENESIS_HASH[TEST_CHAIN];
const prefix = SS58_FORMAT[TEST_CHAIN];
const endpoint = ENDPOINT[TEST_CHAIN];

async function createAccounts() {
    return new Promise((resolve) => {
        const accounts = { parent: undefined, derived: [] };

        cryptoWaitReady().then(() => {
            keyring.loadAll({ ss58Format: 42, type: DEFAULT_TYPE });

            const { pair, json } = keyring.addUri(SEED, PASSWORD, { name: MAIN_ACCOUNT_NAME });

            accounts.parent = json.address;

            // To Derive
            const parentPair = keyring.getPair(accounts.parent);
            parentPair.decodePkcs8(PASSWORD);

            console.log(`🆕 Creating ${NUMBER_OF_DERIVED_ACCOUNTS + 1} accounts ...`);

            for (let i = 0; i < NUMBER_OF_DERIVED_ACCOUNTS; i++) {
                let derivationPath = `//${i}`;
                const derived = parentPair.derive(derivationPath, { genesisHash, name: MAIN_ACCOUNT_NAME, parentAddress: accounts.parent, SEED });
                keyring.addPair(derived, PASSWORD);

                accounts.derived.push(encodeAddress(decodeAddress(derived.address), prefix))
            }
            accounts.parent = encodeAddress(decodeAddress(accounts.parent), prefix);

            console.log(`🧾 Accounts:`, accounts)

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
        const amountToTransfer = TRANSFER_AMOUNT * 10 ** decimal;

        const calls = accounts.derived.map((a) => api.tx.balances.transferKeepAlive(a, amountToTransfer));
        console.log(`↗ Transferring ${amountToTransfer} from ${accounts.parent} to ${accounts.derived.length} other derived accounts`);

        signAndSend(api, api.tx.utility.batchAll(calls), signer, accounts.parent).then(({ success, txHash }) => {
            console.log(`🆗 The batch transfer was :${success ? 'successful' : 'failed'} with hash:${txHash}`);

            resolve(success);
        });
    });
}

async function batchTransferAllBack(accounts, api) {
    const options = {};
    const signedCalls = await Promise.all(accounts.derived.map(async (a) => {
        const signer = keyring.getPair(a);
        signer.unlock(PASSWORD);

        options.nonce = (await api.derive.balances.account(a)).accountNonce;
        options.blockHash = api.genesisHash;
        options.era = 0;

        return await api.tx.balances.transferAll(accounts.parent, false).signAsync(signer, options);
    }));

    console.log(`↗ Withdrawing all amounts from ${accounts.derived.length} derived accounts and transfer to ${accounts.parent}`);

    const results = await Promise.all(signedCalls.map((s) => send(api, s)));
    const isAllStakingSuccessful = !results.find((r) => r.success === false);
    console.log(`🆗 The Withdraws were :${isAllStakingSuccessful ? 'successful' : 'failed'}`);
}

async function batchStake(accounts, api) {
    const STAKE_AMOUNT = api.consts.balances.existentialDeposit;
    console.log(`ℹ Staking ${STAKE_AMOUNT} for ${accounts.derived.length + 1} accounts`);

    const options = {};
    const signedCalls = await Promise.all([accounts.parent].concat(accounts.derived).map(async (a) => {
        const signer = keyring.getPair(a);
        signer.unlock(PASSWORD);

        options.nonce = (await api.derive.balances.account(a)).accountNonce;
        options.blockHash = api.genesisHash;
        options.era = 0;

        return await api.tx.staking.bond(a, STAKE_AMOUNT, 'Staked').signAsync(signer, options);
    }));

    const results = await Promise.all(signedCalls.map((s) => send(api, s)));
    const isAllStakingSuccessful = !results.find((r) => r.success === false);

    console.log(`💰 Staking was ${isAllStakingSuccessful ? 'successful' : 'failed'}`);
    return isAllStakingSuccessful;
}

async function batchRegisterFastUnstake(accounts, api) {
    console.log(`🚀 Requesting * Fast * Unstake for ${accounts.derived.length + 1} accounts`);

    const options = {};
    const signedCalls = await Promise.all([accounts.parent].concat(accounts.derived).map(async (a) => {
        const signer = keyring.getPair(a);
        signer.unlock(PASSWORD);

        options.nonce = (await api.derive.balances.account(a)).accountNonce;
        options.blockHash = api.genesisHash;
        options.era = 0;

        return await api.tx.fastUnstake.registerFastUnstake().signAsync(signer, options);
    }));

    const results = await Promise.all(signedCalls.map((s) => send(api, s)));
    const isAllRequestedSuccessfully = !results.find((r) => r.success === false);

    console.log(`🏁 fast unstaking results: ${isAllRequestedSuccessfully ? 'successful' : 'failed'}`);
    return isAllRequestedSuccessfully;
}

async function batchTx(accounts, api, tx, params) {
    const options = {};
    const signedCalls = await Promise.all(accounts.derived.map(async (a) => {
        const signer = keyring.getPair(a);
        signer.unlock(PASSWORD);

        options.nonce = (await api.derive.balances.account(a)).accountNonce;
        options.blockHash = api.genesisHash;
        options.era = 0;

        return await tx(...params).signAsync(signer, options);
    }));

    console.log(`↗ Withdrawing all amounts from ${accounts.derived.length} derived accounts and transfer to ${accounts.parent}`);

    const results = await Promise.all(signedCalls.map((s) => send(api, s)));
    const isAllStakingSuccessful = !results.find((r) => r.success === false);
    console.log(`🆗 The Withdraws were :${isAllStakingSuccessful ? 'successful' : 'failed'}`);
}

const TEST_MAP = {
    TEST_FAST_UNSTAKE: 0,
    WITHDRAW_ALL: 1
}

async function main() {
    const accounts = await createAccounts();

    const wsProvider = new WsProvider(endpoint);
    console.log('⌛ waiting for api to be connected ...');
    const api = await ApiPromise.create({ provider: wsProvider });
    console.log(`💹 api is connected, genesisHash: ${api.genesisHash}`);

    let testCase = TEST_MAP.TEST_FAST_UNSTAKE; // ** Needs to be set Manually ;) **

    // switch (testCase) {
    //     case (TEST_MAP.TEST_FAST_UNSTAKE):
    //         const isSuccessfulTransfer = await batchTransfer(accounts, api);
    //         if (isSuccessfulTransfer) {
    //             const isAllStakingSuccessful = await batchStake(accounts, api);
    //             isAllStakingSuccessful && batchRegisterFastUnstake(accounts, api);
    //         }
    //         break;
    //     case (TEST_MAP.WITHDRAW_ALL):
    //         batchTransferAllBack(accounts, api);
    // }
}

main();