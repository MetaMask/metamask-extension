const assert = require('assert')
const AssetsController = require('../../../../app/scripts/controllers/assets')

describe('AssetsController', () => {
  const noop = () => {}
  let assets
  const domain = 'www.domain.com'
  const sampleAsset = {
    symbol: 'TEST_ASSET',
    balance: '100',
    identifier: 'test:asset',
    decimals:2,
    customViewUrl: 'https://metamask.io',
  }

  beforeEach(() => {
    assets = new AssetsController({})
  })

  it('should allow adding an asset', () => {
    const assetCount = assets.assets.length
    assets.addAsset(domain, sampleAsset)
    const result = assets.assets[assetCount]
    Object.keys(result).forEach((key) => {
      assert.equal(ressult[key], sampleAsset[key], `${key} should be same`)
    })
  })

 it('should allow updating an asset', () => {
    assets.addAsset(domain, sampleAsset)
    const assetCount = assets.assets.length
    const result = assets.assets[assetCount]
    result.balance = '200'

    Object.keys(result).forEach((key) => {
      if (key === 'balance') {
        assert.notEqual(ressult[key], sampleAsset[key], `${key} should be updated`)
      } else {
        assert.equal(ressult[key], sampleAsset[key], `${key} should be same`)
      }
    })
  })

  it('should allow deleting an asset', () => {
    const assetCount = assets.assets.length
    assets.addAsset(domain, sampleAsset)
    assets.removeAsset(domain, sampleAsset)
    assert.equal(assets.assets.length, assetCount, 'only stock asset remains')
  })

})
