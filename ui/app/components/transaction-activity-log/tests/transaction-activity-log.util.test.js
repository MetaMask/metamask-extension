import assert from 'assert'
import { getActivities } from '../transaction-activity-log.util'

describe('getActivities', () => {
  it('should return no activities for an empty history', () => {
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

  it('should return activities for a transaction\'s history', () => {
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
          {
            op: 'add',
            path: '/gasPriceSpecified',
            value: true,
          },
          {
            op: 'add',
            path: '/gasLimitSpecified',
            value: true,
          },
          {
            op: 'add',
            path: '/estimatedGas',
            value: '0x5208',
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
            value: '0xf86b81a4843b9aca008252089450a9d56c2b8ba9a5c7f2c08c3d26e0499f23a706872386f26fc10000802aa007b30119fc4fc5954fad727895b7e3ba80a78d197e95703cc603bcf017879151a01c50beda40ffaee541da9c05b9616247074f25f392800e0ad6c7a835d5366edf',
          },
        ],
        [],
        [
          {
            note: 'transactions#setTxHash',
            op: 'add',
            path: '/hash',
            timestamp: 1535507564658,
            value: '0x7acc4987b5c0dfa8d423798a8c561138259de1f98a62e3d52e7e83c0e0dd9fb7',
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
    }

    const expectedResult = [
      {
        'eventKey': 'transactionCreated',
        'timestamp': 1535507561452,
        'value': '0x2386f26fc10000',
      },
      {
        'eventKey': 'transactionUpdatedGas',
        'timestamp': 1535664571504,
        'value': '0x77359400',
      },
      {
        'eventKey': 'transactionSubmitted',
        'timestamp': 1535507564665,
        'value': undefined,
      },
      {
        'eventKey': 'transactionConfirmed',
        'timestamp': 1535507615993,
        'value': undefined,
      },
    ]

    assert.deepEqual(getActivities(transaction), expectedResult)
  })
})
