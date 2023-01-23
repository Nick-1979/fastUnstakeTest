// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

export async function signAndSend(api, submittable, _signer, senderAddress) {
  return new Promise((resolve) => {
    // eslint-disable-next-line no-void
    void submittable.signAndSend(_signer, async (result) => {
      let success = true;
      let failureText = '';

      if (result.dispatchError) {
        if (result.dispatchError.isModule) {
          // for module errors, we have the section indexed, lookup
          const decoded = api.registry.findMetaError(result.dispatchError.asModule);
          const { docs, name, section } = decoded;

          success = false;
          failureText = `${docs.join(' ')}`;

          console.log(`dispatchError module: ${section}.${name}: ${docs.join(' ')}`);
        } else {
          // Other, CannotLookup, BadOrigin, no extra info
          console.log(`dispatchError other reason: ${result.dispatchError.toString()}`);
        }
      }

      if (result.status.isFinalized || result.status.isInBlock) {

        const hash = result.status.isFinalized ? result.status.asFinalized : result.status.asInBlock;

        const signedBlock = await api.rpc.chain.getBlock(hash);
        const blockNumber = signedBlock.block.header.number;
        const txHash = result.txHash.toString();

        const fee = undefined; //queryInfo.partialFee.toString();

        resolve({ block: Number(blockNumber), failureText, fee, success, txHash });
      }
    }).catch((e) => {
      console.log('catch error', e);
      resolve({ block: 0, failureText: String(e), fee: '', success: false, txHash: '' });
    });
  });
}

