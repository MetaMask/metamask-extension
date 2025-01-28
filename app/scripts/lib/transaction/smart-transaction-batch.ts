import {
  ActionConstraint,
  ControllerMessenger,
} from '@metamask/base-controller';
import SmartTransactionsController, {
  SmartTransactionsControllerSmartTransactionEvent,
} from '@metamask/smart-transactions-controller';
import { createProjectLogger } from '@metamask/utils';

const log = createProjectLogger('smart-transaction-batch');

type Messenger = ControllerMessenger<
  ActionConstraint,
  SmartTransactionsControllerSmartTransactionEvent
>;

type smartTransactionPublishBatchHookRequest = {
  messenger: Messenger;
  smartTransactionsController: SmartTransactionsController;
};

export async function smartTransactionPublishBatchHook(
  request: smartTransactionPublishBatchHookRequest,
  signedTxs: string[],
) {
  log('Request', signedTxs);

  const { messenger, smartTransactionsController } = request;

  const { uuid } = await smartTransactionsController.submitSignedTransactions({
    signedTransactions: signedTxs,
    signedCanceledTransactions: [],
  });

  log('Submitted', uuid);

  const hashes = await waitForHashes(uuid, messenger);

  log('Hashes', hashes);

  return { transactionHash: hashes };
}

async function waitForHashes(
  uuid: string,
  messenger: ControllerMessenger<
    ActionConstraint,
    SmartTransactionsControllerSmartTransactionEvent
  >,
) {
  return new Promise((resolve) => {
    messenger.subscribe(
      'SmartTransactionsController:smartTransaction',
      async (smartTransaction) => {
        if (
          smartTransaction.uuid !== uuid ||
          smartTransaction.status !== 'success'
        ) {
          return;
        }

        const hashes = await getHashes(uuid);

        resolve(hashes);
      },
    );
  });
}

async function getHashes(uuid: string) {
  const response = await fetch(
    `https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/smart-transactions/${uuid}`,
  );

  const json = await response.json();
  const transactions = json.transactions as { hash: string }[];
  const hashes = transactions.map((tx) => tx.hash).reverse();

  log('Info', json, hashes);

  return hashes;
}
