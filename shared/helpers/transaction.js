import hash from 'hash-sum'
import { omit } from 'lodash'

/**
 * Generates a deterministic hash of txParams to create an intentId.
 * We omit gas and gasPrice as these will fluctuate and do not determine
 * the intent. To avoid erroneously grouping multiple unapproved txs
 * without a nonce but same details. e.g if a user sends the same amount of
 * eth to the same address three times consecutively, for whatever reason,
 * we do not want to group them as one pending transaction.
 * @param {} txParams
 * @param {*} txId
 */
export function generateMetaMaskTxId (txParams, txId) {
  return hash(omit({ nonce: txId, ...txParams }, ['gas', 'gasPrice']))
}
