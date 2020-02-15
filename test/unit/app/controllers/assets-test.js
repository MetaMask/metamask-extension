const assert = require('assert')
const ResourcesController = require('../../../../app/scripts/controllers/resource')

describe('ResourcesController as AssetsController', () => {
  let assets

  const requiredFields = ['symbol', 'balance', 'identifier', 'decimals', 'customViewUrl']
  const storageKey = 'resources:assets'

  const domain = 'www.domain.com'
  const sampleAsset = {
    symbol: 'TEST_ASSET',
    balance: '100',
    identifier: 'test:asset',
    decimals: 2,
    customViewUrl: 'https://metamask.io',
  }

  beforeEach(() => {
    assets = new ResourcesController({
      requiredFields,
      storageKey,
    })
  })

  it('should allow adding an asset', () => {
    const assetCount = assets.resources.length
    assets.add(domain, sampleAsset)
    const result = assets.resources[assetCount]
    Object.keys(result).forEach((key) => {
      if (key === 'fromDomain') {
        return
      }
      assert.equal(result[key], sampleAsset[key], `${key} should be same`)
    })
  })

  it('should allow updating an asset', () => {
    const assetCount = assets.resources.length
    assets.add(domain, sampleAsset)
    const result = assets.resources[assetCount]
    result.balance = '200'
    assets.update(domain, result)

    Object.keys(result).forEach((key) => {
      if (key === 'fromDomain') {
        return
      }
      if (key === 'balance') {
        assert.notEqual(result[key], sampleAsset[key], `${key} should be updated`)
      } else {
        assert.equal(result[key], sampleAsset[key], `${key} should be same`)
      }
    })
  })

  it('adding twice should result in just one', () => {
    let assetCount = assets.resources.length
    assets.add(domain, sampleAsset)
    const result = assets.resources[assetCount]
    result.balance = '200'
    assetCount = assets.resources.length

    const clone = {}
    for (const key in result) {
      clone[key] = result[key]
    }

    assets.add(domain, clone)
    const laterAssetCount = assets.resources.length
    assert.equal(laterAssetCount, assetCount, 'should not add up')

    Object.keys(result).forEach((key) => {
      if (key === 'fromDomain') {
        return
      }
      if (key === 'balance') {
        assert.notEqual(result[key], sampleAsset[key], `${key} should be updated`)
      } else {
        assert.equal(result[key], sampleAsset[key], `${key} should be same`)
      }
    })
  })

  it('should allow deleting an asset', () => {
    const assetCount = assets.resources.length
    assets.add(domain, sampleAsset)
    assets.remove(domain, sampleAsset)
    assert.equal(assets.resources.length, assetCount, 'only stock asset remains')
  })
})

