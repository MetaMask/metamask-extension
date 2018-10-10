const reactTriggerChange = require('react-trigger-change')
const PASSWORD = 'password123'
const runMascaraFirstTimeTest = require('./mascara-first-time')
const {
  timeout,
  findAsync,
} = require('../../lib/util')

QUnit.module('first time usage')

QUnit.test('render init screen', (assert) => {
  const done = assert.async()
  runFirstTimeUsageTest(assert).then(done).catch((err) => {
    assert.notOk(err, `Error was thrown: ${err.stack}`)
    done()
  })
})

async function runFirstTimeUsageTest(assert, done) {
  if (window.METAMASK_PLATFORM_TYPE === 'mascara') {
    return runMascaraFirstTimeTest(assert, done)
  }

  const selectState = $('select')
  selectState.val('first time')
  reactTriggerChange(selectState[0])

  const app = $('#app-content')

  // Selects new ui
  const tryNewUIButton = (await findAsync(app, 'button.negative'))[0]
  tryNewUIButton.click()
  await timeout()

  // recurse notices
  while (true) {
    const button = await findAsync(app, 'button')
    if (button.html() === 'Accept') {
      // still notices to accept
      const termsPageRaw = await findAsync(app, '.markdown')
      const termsPage = (await findAsync(app, '.markdown'))[0]
      console.log('termsPageRaw', termsPageRaw)
      termsPage.scrollTop = termsPage.scrollHeight
      console.log('Clearing notice')
      button.click()
    } else {
      // exit loop
      console.log('No more notices...')
      break
    }
  }

  // Scroll through terms
  const title = (await findAsync(app, 'h1'))[0]
  assert.equal(title.textContent, 'MetaMask', 'title screen')

  // enter password
  const pwBox = (await findAsync(app, '#password-box'))[0]
  const confBox = (await findAsync(app, '#password-box-confirm'))[0]
  pwBox.value = PASSWORD
  confBox.value = PASSWORD

  // create vault
  const createButton = (await findAsync(app, 'button.primary'))[0]
  createButton.click()

  await timeout()
  const created = (await findAsync(app, 'h3'))[0]
  assert.equal(created.textContent, 'Vault Created', 'Vault created screen')

  // Agree button
  const button = (await findAsync(app, 'button'))[0]
  assert.ok(button, 'button present')
  button.click()

  const detail = (await findAsync(app, '.account-detail-section'))[0]
  assert.ok(detail, 'Account detail section loaded.')

  const sandwich = (await findAsync(app, '.sandwich-expando'))[0]
  sandwich.click()

  const menu = (await findAsync(app, '.menu-droppo'))[0]
  const children = menu.children
  const logout = children[2]
  assert.ok(logout, 'Lock menu item found')
  logout.click()

  const pwBox2 = (await findAsync(app, '#password-box'))[0]
  pwBox2.value = PASSWORD

  const createButton2 = (await findAsync(app, 'button.primary'))[0]
  createButton2.click()

  const detail2 = (await findAsync(app, '.account-detail-section'))[0]
  assert.ok(detail2, 'Account detail section loaded again.')

  // open account settings dropdown
  const qrButton = (await findAsync(app, '.fa.fa-ellipsis-h'))[0]
  qrButton.click()

  // qr code item
  const qrButton2 = (await findAsync(app, '.dropdown-menu-item'))[1]
  qrButton2.click()

  const qrHeader = (await findAsync(app, '.qr-header'))[0]
  const qrContainer = (await findAsync(app, '#qr-container'))[0]
  assert.equal(qrHeader.textContent, 'Account 1', 'Should show account label.')
  assert.ok(qrContainer, 'QR Container found')

  const networkMenu = (await findAsync(app, '.network-indicator'))[0]
  networkMenu.click()

  const networkMenu2 = (await findAsync(app, '.network-indicator'))[0]
  const children2 = networkMenu2.children
  children2.length[3]
  assert.ok(children2, 'All network options present')
}
