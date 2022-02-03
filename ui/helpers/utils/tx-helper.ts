import log from 'loglevel';
import { transactionMatchesNetwork } from '../../../shared/modules/transaction.utils';
import { valuesFor } from './util';

type Message = {
  metamaskNetworkId: string;
  time: number;
};

type MessagesByKey = Record<string, Message> | null | undefined;

export default function txHelper(
  unapprovedTxs: MessagesByKey,
  unapprovedMsgs: MessagesByKey,
  personalMsgs: MessagesByKey,
  decryptMsgs: MessagesByKey,
  encryptionPublicKeyMsgs: MessagesByKey,
  typedMessages: MessagesByKey,
  network: string,
  chainId: string,
): Message[] {
  log.debug('tx-helper called with params:');
  log.debug({
    unapprovedTxs,
    unapprovedMsgs,
    personalMsgs,
    decryptMsgs,
    encryptionPublicKeyMsgs,
    typedMessages,
    network,
    chainId,
  });

  const txValues = network
    ? (valuesFor(unapprovedTxs) as Message[]).filter((txMeta) =>
        transactionMatchesNetwork(txMeta, chainId, network),
      )
    : (valuesFor(unapprovedTxs) as Message[]);
  log.debug(`tx helper found ${txValues.length} unapproved txs`);

  const msgValues = valuesFor(unapprovedMsgs) as Message[];
  log.debug(`tx helper found ${msgValues.length} unsigned messages`);
  let allValues = txValues.concat(msgValues);

  const personalValues = valuesFor(personalMsgs) as Message[];
  log.debug(
    `tx helper found ${personalValues.length} unsigned personal messages`,
  );
  allValues = allValues.concat(personalValues);

  const decryptValues = valuesFor(decryptMsgs) as Message[];
  log.debug(`tx helper found ${decryptValues.length} decrypt requests`);
  allValues = allValues.concat(decryptValues);

  const encryptionPublicKeyValues = valuesFor(
    encryptionPublicKeyMsgs,
  ) as Message[];
  log.debug(
    `tx helper found ${encryptionPublicKeyValues.length} encryptionPublicKey requests`,
  );
  allValues = allValues.concat(encryptionPublicKeyValues);

  const typedValues = valuesFor(typedMessages) as Message[];
  log.debug(`tx helper found ${typedValues.length} unsigned typed messages`);
  allValues = allValues.concat(typedValues);

  allValues = allValues.sort((a, b) => {
    return a.time - b.time;
  });

  return allValues;
}
