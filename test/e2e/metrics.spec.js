const { strict: assert } = require('assert')
const { By, Key } = require('selenium-webdriver')
const { withFixtures } = require('./helpers')

/**
 * WARNING: These tests must be run using a build created with `yarn build:test:metrics`, so that it has
 * the correct Segment host and write keys set. Otherwise this test will fail.
 */
describe('Segment metrics', function () {
  this.timeout(0)

  it('should send first three Page metric events upon fullscreen page load', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
        },
      ],
    }
    await withFixtures(
      {
        fixtures: 'metrics-enabled',
        ganacheOptions,
        title: this.test.title,
        mockSegment: true,
      },
      async ({ driver, segmentSpy }) => {
        await driver.navigate()
        const passwordField = await driver.findElement(By.css('#password'))
        await passwordField.sendKeys('correct horse battery staple')
        await passwordField.sendKeys(Key.ENTER)

        // find arbitary element to ensure Home page has loaded
        await driver.findElement(By.css('[data-testid="eth-overview-send"]'))

        assert.ok(segmentSpy.called, 'Segment should receive metrics')

        const firstSegmentEvent = segmentSpy.getCall(0).args[0]
        assert.equal(firstSegmentEvent.name, 'Home')
        assert.equal(firstSegmentEvent.context.page.path, '/')

        const secondSegmentEvent = segmentSpy.getCall(1).args[0]
        assert.equal(secondSegmentEvent.name, 'Unlock Page')
        assert.equal(secondSegmentEvent.context.page.path, '/unlock')

        const thirdSegmentEvent = segmentSpy.getCall(2).args[0]
        assert.equal(thirdSegmentEvent.name, 'Home')
        assert.equal(thirdSegmentEvent.context.page.path, '/')
      },
    )
  })
})
