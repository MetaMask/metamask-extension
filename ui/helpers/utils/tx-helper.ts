import log from 'loglevel';
import { valuesFor } from './util';

export default function txHelper(
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unapprovedTxs: Record<string, any> | null,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  personalMsgs: Record<string, any> | null,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  decryptMsgs: Record<string, any> | null,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  encryptionPublicKeyMsgs: Record<string, any> | null,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typedMessages: Record<string, any> | null,
  chainId?: string,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  log.debug('tx-helper called with params:');
  log.debug({
    unapprovedTxs,
    personalMsgs,
    decryptMsgs,
    encryptionPublicKeyMsgs,
    typedMessages,
    chainId,
  });

  const txValues = chainId
    ? valuesFor(unapprovedTxs).filter((txMeta) => txMeta.chainId === chainId)
    : valuesFor(unapprovedTxs);

  const personalValues = valuesFor(personalMsgs);
  const decryptValues = valuesFor(decryptMsgs);
  const encryptionPublicKeyValues = valuesFor(encryptionPublicKeyMsgs);
  const typedValues = valuesFor(typedMessages);

  const allValues = txValues
    .concat(personalValues)
    .concat(decryptValues)
    .concat(encryptionPublicKeyValues)
    .concat(typedValues)
    .sort((a, b) => {
      return a.time - b.time;
    });

  log.debug(`tx helper found ${txValues.length} unapproved txs`);
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
