const assert = require('assert')
const { getEnvironmentType, sufficientBalance } = require('../../../app/scripts/lib/util')
const {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_BACKGROUND,
} = require('../../../app/scripts/lib/enums')

describe('getEnvironmentType', function () {
  it('should return popup type', function () {
    const environmentType = getEnvironmentType('http://extension-id/popup.html')
    assert.equal(environmentType, ENVIRONMENT_TYPE_POPUP)
  })

  it('should return notification type', function () {
    const environmentType = getEnvironmentType('http://extension-id/notification.html')
    assert.equal(environmentType, ENVIRONMENT_TYPE_NOTIFICATION)
  })

  it('should return fullscreen type', function () {
    const environmentType = getEnvironmentType('http://extension-id/home.html')
    assert.equal(environmentType, ENVIRONMENT_TYPE_FULLSCREEN)
  })

  it('should return background type', function () {
    const environmentType = getEnvironmentType('http://extension-id/_generated_background_page.html')
    assert.equal(environmentType, ENVIRONMENT_TYPE_BACKGROUND)
  })

  it('should return the correct type for a URL with a hash fragment', function () {
    const environmentType = getEnvironmentType('http://extension-id/popup.html#hash')
    assert.equal(environmentType, ENVIRONMENT_TYPE_POPUP)
  })

  it('should return the correct type for a URL with query parameters', function () {
    const environmentType = getEnvironmentType('http://extension-id/popup.html?param=foo')
    assert.equal(environmentType, ENVIRONMENT_TYPE_POPUP)
  })

  it('should return the correct type for a URL with query parameters and a hash fragment', function () {
    const environmentType = getEnvironmentType('http://extension-id/popup.html?param=foo#hash')
    assert.equal(environmentType, ENVIRONMENT_TYPE_POPUP)
  })
})

describe('SufficientBalance', function () {
  it('returns true if max tx cost is equal to balance.', function () {
    const tx = {
      'value': '0x1',
      'gas': '0x2',
      'gasPrice': '0x3',
    }
    const balance = '0x8'

    const result = sufficientBalance(tx, balance)
    assert.ok(result, 'sufficient balance found.')
  })

  it('returns true if max tx cost is less than balance.', function () {
    const tx = {
      'value': '0x1',
      'gas': '0x2',
      'gasPrice': '0x3',
    }
    const balance = '0x9'

    const result = sufficientBalance(tx, balance)
    assert.ok(result, 'sufficient balance found.')
  })

  it('returns false if max tx cost is more than balance.', function () {
    const tx = {
      'value': '0x1',
      'gas': '0x2',
      'gasPrice': '0x3',
    }
    const balance = '0x6'

    const result = sufficientBalance(tx, balance)
    assert.ok(!result, 'insufficient balance found.')
  })
})
