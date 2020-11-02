import assert from 'assert'
import {
  combineTransactionHistories,
  getActivities,
} from '../transaction-activity-log.util'

describe('TransactionActivityLog utils', function () {
  describe('combineTransactionHistories', function () {
    it('should return no activities for an empty list of transactions', function () {
      assert.deepEqual(combineTransactionHistories([]), [])
    })

    it('should return activities for an array of transactions', function () {
      const transactions = [
        {
          hash:
            '0xa14f13d36b3901e352ce3a7acb9b47b001e5a3370f06232a0953c6fc6fad91b3',
          history: [
            {
              id: 6400627574331058,
              time: 1543958845581,
              status: 'unapproved',
              metamaskNetworkId: '3',
              loadingDefaults: true,
              txParams: {
                from: '0x50a9d56c2b8ba9a5c7f2c08c3d26e0499f23a706',
                to: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
                value: '0x2386f26fc10000',
                gas: '0x5208',
                gasPrice: '0x3b9aca00',
              },
              type: 'standard',
            },
            [
              {
                op: 'replace',
                path: '/status',
                value: 'approved',
                note: 'txStateManager: setting status to approved',
                timestamp: 1543958847813,
              },
            ],
            [
              {
                op: 'replace',
                path: '/status',
                value: 'submitted',
                note: 'txStateManager: setting status to submitted',
                timestamp: 1543958848147,
              },
            ],
            [
              {
                op: 'replace',
                path: '/status',
                value: 'dropped',
                note: 'txStateManager: setting status to dropped',
                timestamp: 1543958897181,
              },
              {
                op: 'add',
                path: '/replacedBy',
                value:
                  '0xecbe181ee67c4291d04a7cb9ffbf1d5d831e4fbaa89994fd06bab5dd4cc79b33',
              },
            ],
          ],
          id: 6400627574331058,
          loadingDefaults: false,
          metamaskNetworkId: '3',
          status: 'dropped',
          submittedTime: 1543958848135,
          time: 1543958845581,
          txParams: {
            from: '0x50a9d56c2b8ba9a5c7f2c08c3d26e0499f23a706',
            gas: '0x5208',
            gasPrice: '0x3b9aca00',
            nonce: '0x32',
            to: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
            value: '0x2386f26fc10000',
          },
          type: 'standard',
        },
        {
          hash:
            '0xecbe181ee67c4291d04a7cb9ffbf1d5d831e4fbaa89994fd06bab5dd4cc79b33',
          history: [
            {
              id: 6400627574331060,
              time: 1543958857697,
              status: 'unapproved',
              metamaskNetworkId: '3',
              loadingDefaults: false,
              txParams: {
                from: '0x50a9d56c2b8ba9a5c7f2c08c3d26e0499f23a706',
                to: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
                value: '0x2386f26fc10000',
                gas: '0x5208',
                gasPrice: '0x3b9aca00',
                nonce: '0x32',
              },
              lastGasPrice: '0x4190ab00',
              type: 'retry',
            },
            [
              {
                op: 'replace',
                path: '/txParams/gasPrice',
                value: '0x481f2280',
                note: 'confTx: user approved transaction',
                timestamp: 1543958859470,
              },
            ],
            [
              {
                op: 'replace',
                path: '/status',
                value: 'approved',
                note: 'txStateManager: setting status to approved',
                timestamp: 1543958859485,
              },
            ],
            [
              {
                op: 'replace',
                path: '/status',
                value: 'signed',
                note: 'transactions#publishTransaction',
                timestamp: 1543958859889,
              },
            ],
            [
              {
                op: 'replace',
                path: '/status',
                value: 'submitted',
                note: 'txStateManager: setting status to submitted',
                timestamp: 1543958860061,
              },
            ],
            [
              {
                op: 'add',
                path: '/firstRetryBlockNumber',
                value: '0x45a0fd',
                note: 'transactions/pending-tx-tracker#event: tx:block-update',
                timestamp: 1543958896466,
              },
            ],
            [
              {
                op: 'replace',
                path: '/status',
                value: 'confirmed',
                timestamp: 1543958897165,
              },
            ],
          ],
          id: 6400627574331060,
          lastGasPrice: '0x4190ab00',
          loadingDefaults: false,
          metamaskNetworkId: '3',
          status: 'confirmed',
          submittedTime: 1543958860054,
          time: 1543958857697,
          txParams: {
            from: '0x50a9d56c2b8ba9a5c7f2c08c3d26e0499f23a706',
            gas: '0x5208',
            gasPrice: '0x481f2280',
            nonce: '0x32',
            to: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
            value: '0x2386f26fc10000',
          },
          txReceipt: {
            status: '0x1',
          },
          type: 'retry',
        },
      ]

      const expected = [
        {
          id: 6400627574331058,
          hash:
            '0xa14f13d36b3901e352ce3a7acb9b47b001e5a3370f06232a0953c6fc6fad91b3',
          eventKey: 'transactionCreated',
          timestamp: 1543958845581,
          value: '0x2386f26fc10000',
        },
        {
          id: 6400627574331058,
          hash:
            '0xa14f13d36b3901e352ce3a7acb9b47b001e5a3370f06232a0953c6fc6fad91b3',
          eventKey: 'transactionSubmitted',
          timestamp: 1543958848147,
          value: '0x1319718a5000',
        },
        {
          id: 6400627574331060,
          hash:
            '0xecbe181ee67c4291d04a7cb9ffbf1d5d831e4fbaa89994fd06bab5dd4cc79b33',
          eventKey: 'transactionResubmitted',
          timestamp: 1543958860061,
          value: '0x171c3a061400',
        },
        {
          id: 6400627574331060,
          hash:
            '0xecbe181ee67c4291d04a7cb9ffbf1d5d831e4fbaa89994fd06bab5dd4cc79b33',
          eventKey: 'transactionConfirmed',
          timestamp: 1543958897165,
          value: '0x171c3a061400',
        },
      ]

      assert.deepEqual(combineTransactionHistories(transactions), expected)
    })
  })

  describe('getActivities', function () {
    it('should return no activities for an empty history', function () {
      const transaction = {
        history: [],
        id: 1,
        status: 'confirmed',
        txParams: {
          from: '0x1',
          gas: '0x5208',
          gasPrice: '0x3b9aca00',
          nonce: '0xa4',
          to: '0x2',
          value: '0x2386f26fc10000',
        },
      }

      assert.deepEqual(getActivities(transaction), [])
    })

    it("should return activities for a transaction's history", function () {
      const transaction = {
        history: [
          {
            id: 5559712943815343,
            loadingDefaults: true,
            metamaskNetworkId: '3',
            status: 'unapproved',
            time: 1535507561452,
            txParams: {
              from: '0x1',
              gas: '0x5208',
              gasPrice: '0x3b9aca00',
              nonce: '0xa4',
              to: '0x2',
              value: '0x2386f26fc10000',
            },
          },
          [
            {
              op: 'replace',
              path: '/loadingDefaults',
              timestamp: 1535507561515,
              value: false,
            },
          ],
          [
            {
              note: '#newUnapprovedTransaction - adding the origin',
              op: 'add',
              path: '/origin',
              timestamp: 1535507561516,
              value: 'MetaMask',
            },
            [],
          ],
          [
            {
              note: 'confTx: user approved transaction',
              op: 'replace',
              path: '/txParams/gasPrice',
              timestamp: 1535664571504,
              value: '0x77359400',
            },
          ],
          [
            {
              note: 'txStateManager: setting status to approved',
              op: 'replace',
              path: '/status',
              timestamp: 1535507564302,
              value: 'approved',
            },
          ],
          [
            {
              note: 'transactions#approveTransaction',
              op: 'add',
              path: '/txParams/nonce',
              timestamp: 1535507564439,
              value: '0xa4',
            },
            {
              op: 'add',
              path: '/nonceDetails',
              value: {
                local: {},
                network: {},
                params: {},
              },
            },
          ],
          [
            {
              note: 'transactions#publishTransaction',
              op: 'replace',
              path: '/status',
              timestamp: 1535507564518,
              value: 'signed',
            },
            {
              op: 'add',
              path: '/rawTx',
              value:
                '0xf86b81a4843b9aca008252089450a9d56c2b8ba9a5c7f2c08c3d26e0499f23a706872386f26fc10000802aa007b30119fc4fc5954fad727895b7e3ba80a78d197e95703cc603bcf017879151a01c50beda40ffaee541da9c05b9616247074f25f392800e0ad6c7a835d5366edf',
            },
          ],
          [],
          [
            {
              note: 'transactions#setTxHash',
              op: 'add',
              path: '/hash',
              timestamp: 1535507564658,
              value:
                '0x7acc4987b5c0dfa8d423798a8c561138259de1f98a62e3d52e7e83c0e0dd9fb7',
            },
          ],
          [
            {
              note: 'txStateManager - add submitted time stamp',
              op: 'add',
              path: '/submittedTime',
              timestamp: 1535507564660,
              value: 1535507564660,
            },
          ],
          [
            {
              note: 'txStateManager: setting status to submitted',
              op: 'replace',
              path: '/status',
              timestamp: 1535507564665,
              value: 'submitted',
            },
          ],
          [
            {
              note: 'transactions/pending-tx-tracker#event: tx:block-update',
              op: 'add',
              path: '/firstRetryBlockNumber',
              timestamp: 1535507575476,
              value: '0x3bf624',
            },
          ],
          [
            {
              note: 'txStateManager: setting status to confirmed',
              op: 'replace',
              path: '/status',
              timestamp: 1535507615993,
              value: 'confirmed',
            },
          ],
        ],
        id: 1,
        status: 'confirmed',
        txParams: {
          from: '0x1',
          gas: '0x5208',
          gasPrice: '0x3b9aca00',
          nonce: '0xa4',
          to: '0x2',
          value: '0x2386f26fc10000',
        },
        hash: '0xabc',
      }

      const expectedResult = [
        {
          eventKey: 'transactionCreated',
          timestamp: 1535507561452,
          value: '0x2386f26fc10000',
          id: 1,
          hash: '0xabc',
        },
        {
          eventKey: 'transactionSubmitted',
          timestamp: 1535507564665,
          value: '0x2632e314a000',
          id: 1,
          hash: '0xabc',
        },
        {
          eventKey: 'transactionConfirmed',
          timestamp: 1535507615993,
          value: '0x2632e314a000',
          id: 1,
          hash: '0xabc',
        },
      ]

      assert.deepEqual(getActivities(transaction, true), expectedResult)
    })
  })
})
