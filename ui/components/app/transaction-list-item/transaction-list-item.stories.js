import React from 'react';
import PropTypes from 'prop-types';
import { text } from '@storybook/addon-knobs';
import TransactionListItem from './transaction-list-item.component';

export default {
  title: 'TransactionListItem',
};

const addressFixture = '0xe206e3DCa498258f1B7EEc1c640B5AEE7BB88Fd0'

// modified from .storybook/test-data.js
/**
 * An object representing a transaction, in whatever state it is in.
 * @typedef {Object} TransactionMeta
 *
 * @property {string} [blockNumber] - The block number this transaction was
 *  included in. Currently only present on incoming transactions!
 * @property {number} id - An internally unique tx identifier.
 * @property {number} time - Time the transaction was first suggested, in unix
 *  epoch time (ms).
 * @property {TransactionTypeString} type - The type of transaction this txMeta
 *  represents.
 * @property {TransactionStatusString} status - The current status of the
 *  transaction.
 * @property {string} metamaskNetworkId - The transaction's network ID, used
 *  for EIP-155 compliance.
 * @property {boolean} loadingDefaults - TODO: Document
 * @property {TxParams} txParams - The transaction params as passed to the
 *  network provider.
 * @property {Object[]} history - A history of mutations to this
 *  TransactionMeta object.
 * @property {string} origin - A string representing the interface that
 *  suggested the transaction.
 * @property {Object} nonceDetails - A metadata object containing information
 *  used to derive the suggested nonce, useful for debugging nonce issues.
 * @property {string} rawTx - A hex string of the final signed transaction,
 *  ready to submit to the network.
 * @property {string} hash - A hex string of the transaction hash, used to
 *  identify the transaction on the network.
 * @property {number} [submittedTime] - The time the transaction was submitted to
 *  the network, in Unix epoch time (ms).
 * @property {TxError} [err] - The error encountered during the transaction
 */
const txFixture = {
  "id": 3111025347726181,
  "time": 1620710815484,
  "status": "unapproved",
  "metamaskNetworkId": "3",
  "chainId": "0x3",
  "loadingDefaults": false,
  "txParams": {
    "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
    "to": "0xaD6D458402F60fD3Bd25163575031ACDce07538D",
    "value": "0x0",
    "data": "0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000",
    "gas": "0xcb28",
    "gasPrice": "0x77359400"
  },
  "type": "standard",
  "origin": "metamask",
  "transactionCategory": "transfer",
  "history": [
    {
      "id": 7786962153682822,
      "time": 1620710815484,
      "status": "unapproved",
      "metamaskNetworkId": "3",
      "chainId": "0x3",
      "loadingDefaults": true,
      "txParams": {
        "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
        "to": "0xaD6D458402F60fD3Bd25163575031ACDce07538D",
        "value": "0x0",
        "data": "0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000",
        "gas": "0xcb28",
        "gasPrice": "0x77359400"
      },
      "type": "standard",
      "origin": "metamask",
      "transactionCategory": "transfer"
    },
    [
      {
        "op": "replace",
        "path": "/loadingDefaults",
        "value": false,
        "note": "Added new unapproved transaction.",
        "timestamp": 1620710815497
      }
    ]
  ],
  warning: {
    error: "[ethjs-query] while formatting outputs from RPC '{\"value\":{\"code\":-32603}}'",
    message: "There was a problem loading this transaction."
  }
}

/**
 * Contains transactions and properties associated with those transactions of the same nonce.
 * @typedef {Object} transactionGroup
 * @property {string} nonce - The nonce that the transactions within this transactionGroup share.
 * @property {Object[]} transactions - An array of transaction (txMeta) objects.
 * @property {Object} initialTransaction - The transaction (txMeta) with the lowest "time".
 * @property {Object} primaryTransaction - Either the latest transaction or the confirmed
 * transaction.
 * @property {boolean} hasRetried - True if a transaction in the group was a retry transaction.
 * @property {boolean} hasCancelled - True if a transaction in the group was a cancel transaction.
*/
const txGroupFixture = {
  transactions: [
    txFixture,
  ],
  initialTransaction: txFixture,
  primaryTransaction: txFixture,
  hasRetried: true,
  hasCancelled: false,
}

export const warning = () => (
  <TransactionListItem
    transactionGroup={txGroupFixture}
  />
);
