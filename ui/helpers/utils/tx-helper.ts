import log from 'loglevel';
import { valuesFor } from './util';

export default function txHelper(
  unapprovedTxs: Record<string, any> | null,
  unapprovedMsgs: Record<string, any> | null,
  personalMsgs: Record<string, any> | null,
  decryptMsgs: Record<string, any> | null,
  encryptionPublicKeyMsgs: Record<string, any> | null,
  typedMessages: Record<string, any> | null,
  chainId?: string,
): Record<string, any> {
  log.debug('tx-helper called with params:');
  log.debug({
    unapprovedTxs,
    unapprovedMsgs,
    personalMsgs,
    decryptMsgs,
    encryptionPublicKeyMsgs,
    typedMessages,
    chainId,
  });

  const txValues = chainId
    ? valuesFor(unapprovedTxs).filter((txMeta) => txMeta.chainId === chainId)
    : valuesFor(unapprovedTxs);

  const msgValues = valuesFor(unapprovedMsgs);
  const personalValues = valuesFor(personalMsgs);
  const decryptValues = valuesFor(decryptMsgs);
  const encryptionPublicKeyValues = valuesFor(encryptionPublicKeyMsgs);
  const typedValues = valuesFor(typedMessages);

  const allValues = txValues
    .concat(msgValues)
    .concat(personalValues)
    .concat(decryptValues)
    .concat(encryptionPublicKeyValues)
    .concat(typedValues)
    .sort((a, b) => {
      return a.time - b.time;
    });

  log.debug(`tx helper found ${txValues.length} unapproved txs`);
  log.debug(`tx helper found ${msgValues.length} unsigned messages`);
  log.debug(
    `tx helper found ${personalValues.length} unsigned personal messages`,
  );
  log.debug(`tx helper found ${decryptValues.length} decrypt requests`);
  log.debug(
    `tx helper found ${encryptionPublicKeyValues.length} encryptionPublicKey requests`,
  );
  log.debug(`tx helper found ${typedValues.length} unsigned typed messages`);

  return allValues;
}
