import assert from 'assert'
import * as tokenUtils from './token-util'

describe('Token utils', function () {
  describe('getTokensRecivedFromTxReceipt', function () {
    const testParams = {
      txReceipt: {
        'blockHash': '0xf8431061d825bc7dc49cfcab7dc48fe403a5983523ab1b056f2d8ddae484b407',
        'blockNumber': '83898c',
        'contractAddress': null,
        'cumulativeGasUsed': '10aa13',
        'from': '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
        'gasUsed': 'cc03',
        'logs': [
          {
            'address': '0x2350fe0a2733bcdfd9b086e34b65d7cdfdd6ef0c',
            'blockHash': '0xf8431061d825bc7dc49cfcab7dc48fe403a5983523ab1b056f2d8ddae484b407',
            'blockNumber': '83898c',
            'data': '0x00000000000000000000000000000000000000000000003635c9adc5dea00000',
            'logIndex': '0',
            'removed': false,
            'topics': [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
              '0x000000000000000000000000e18035bf8712672935fdb4e5e431b1a0183d2dfc',
              '0x0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c970',
            ],
            'transactionHash': '0x463b14aed5191052e2ee5044b2ee5f8e17377f13f2726cc963e49d1f14888209',
            'transactionIndex': '1',
          },
        ],
        'logsBloom': '0x00000000000000000000000000000000000000000000001000000101000000000000000000000000000000000200000000000100000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000002020000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000',
        'status': '0x1',
        'to': '0x2350fe0a2733bcdfd9b086e34b65d7cdfdd6ef0c',
        'transactionHash': '0x463b14aed5191052e2ee5044b2ee5f8e17377f13f2726cc963e49d1f14888209',
        'transactionIndex': '1',
      },
      tokenAddress: '0x2350fe0a2733bcdfd9b086e34b65d7cdfdd6ef0c',
      accountAddress: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
      tokenDecimals: 18,
    }

    it('should return the transferred token value when txReciept has a successful status', function () {
      const { txReceipt, tokenAddress, accountAddress, tokenDecimals } = testParams
      assert.equal(tokenUtils.getTokensRecivedFromTxReceipt(txReceipt, tokenAddress, accountAddress, tokenDecimals), '1000')
    })

    it('should return null when txReciept has a failed status', function () {
      const failedTxReciept = { ...testParams.txReceipt, status: '0x0' }
      const { txReceipt, tokenAddress, accountAddress, tokenDecimals } = { ...testParams, txReceipt: failedTxReciept }
      assert.equal(tokenUtils.getTokensRecivedFromTxReceipt(txReceipt, tokenAddress, accountAddress, tokenDecimals), null)
    })
  })
})
