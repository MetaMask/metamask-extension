const PASSWORD = 'password123'
const reactTriggerChange = require('react-trigger-change')
const {
  timeout,
  findAsync,
  queryAsync,
} = require('../../lib/util')

async function runFirstTimeUsageTest (assert, done) {
  await timeout(4000)

  const app = await queryAsync($, '#app-content')

  await skipNotices(app)

  // Scroll through terms
  const title = (await findAsync(app, '.create-password__title')).text()
  assert.equal(title, 'Create Password', 'create password screen')

  // enter password
  const pwBox = (await findAsync(app, '.first-time-flow__input'))[0]
  const confBox = (await findAsync(app, '.first-time-flow__input'))[1]
  pwBox.value = PASSWORD
  confBox.value = PASSWORD
  reactTriggerChange(pwBox)
  reactTriggerChange(confBox)

  // Create Password
  const createButton = (await findAsync(app, 'button.first-time-flow__button'))[0]
  createButton.click()

  const created = (await findAsync(app, '.unique-image__title'))[0]
  assert.equal(created.textContent, 'Your unique account image', 'unique image screen')

  // Agree button
  let button = (await findAsync(app, 'button'))[0]
  assert.ok(button, 'button present')
  button.click()

  await skipNotices(app)

  // secret backup phrase
  const seedTitle = (await findAsync(app, '.backup-phrase__title'))[0]
  assert.equal(seedTitle.textContent, 'Secret Backup Phrase', 'seed phrase screen')
  ;(await findAsync(app, '.backup-phrase__reveal-button')).click()
  const seedPhrase = (await findAsync(app, '.backup-phrase__secret-words')).text().split(' ')
  ;(await findAsync(app, '.first-time-flow__button')).click()

  await timeout()
  const selectPhrase = text => {
    const option = $('.backup-phrase__confirm-seed-option')
      .filter((i, d) => d.textContent === text)[0]
    $(option).click()
  }

  seedPhrase.forEach(sp => selectPhrase(sp))
  ;(await findAsync(app, '.first-time-flow__button')).click()

  // Deposit Ether Screen
  const buyEthTitle = (await findAsync(app, '.buy-ether__title'))[0]
  assert.equal(buyEthTitle.textContent, 'Deposit Ether', 'deposit ether screen')
  ;(await findAsync(app, '.buy-ether__do-it-later')).click()

  const menu = (await findAsync(app, '.account-menu__icon'))[0]
  menu.click()

  const lock = (await findAsync(app, '.account-menu__logout-button'))[0]
  assert.ok(lock, 'Lock menu item found')
  lock.click()

  const pwBox2 = (await findAsync(app, '#password-box'))[0]
  pwBox2.value = PASSWORD

  const createButton2 = (await findAsync(app, 'button.primary'))[0]
  createButton2.click()

  const detail2 = (await findAsync(app, '.wallet-view'))[0]
  assert.ok(detail2, 'Account detail section loaded again.')

  // open account settings dropdown
  const qrButton = (await findAsync(app, '.wallet-view__details-button'))[0]
  qrButton.click()

  const qrHeader = (await findAsync(app, '.editable-label__value'))[0]
  const qrContainer = (await findAsync(app, '.qr-wrapper'))[0]
  assert.equal(qrHeader.textContent, 'Account 1', 'Should show account label.')
  assert.ok(qrContainer, 'QR Container found')

  const networkMenu = (await findAsync(app, '.network-component'))[0]
  networkMenu.click()

  const networkMenu2 = (await findAsync(app, '.network-indicator'))[0]
  const children2 = networkMenu2.children
  children2.length[3]
  assert.ok(children2, 'All network options present')
}

module.exports = runFirstTimeUsageTest

async function skipNotices (app) {
  while (true) {
    const button = await findAsync(app, 'button')
    if (button && button.html() === 'Accept') {
      // still notices to accept
      const termsPage = (await findAsync(app, '.markdown'))[0]
      if (!termsPage) {
        break
      }
      termsPage.scrollTop = termsPage.scrollHeight
      await timeout()
      button.click()
      await timeout()
    } else {
      console.log('No more notices...')
      break
    }
  }
}
