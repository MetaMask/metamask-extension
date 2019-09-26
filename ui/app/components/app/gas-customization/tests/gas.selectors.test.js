import assert from 'assert'
import {
  getCurrentBlockTime, // Not being used
  getBasicGasEstimateLoadingStatus,
} from '../gas.selectors'

describe('Gas Selectors', () => {
  const state = {
    gas: {
      currentBlockTime: '', // don't know what value this should be
      basicEstimateIsLoading: false,
    },
  }

  it('gets current block time from state', () => {
    assert.equal(getCurrentBlockTime(state), '')
  })

  it('get gas estimation loading stateu from state', () => {
    assert.equal(getBasicGasEstimateLoadingStatus(state), false)
  })
})
