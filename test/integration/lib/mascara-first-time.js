const PASSWORD = 'password123'
const {
  timeout,
  findAsync,
  queryAsync,
} = require('../../lib/util')

async function runFirstTimeUsageTest (assert, done) {
  await timeout(4000)

  const app = await queryAsync($, '#app-content')

  // Used to set values on TextField input component
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set

  await skipNotices(app)

  const welcomeButton = (await findAsync(app, '.welcome-screen__button'))[0]
  welcomeButton.click()

  // Scroll through terms
  const title = (await findAsync(app, '.create-password__title')).text()
  assert.equal(title, 'Create Password', 'create password screen')

  // enter password
  const pwBox = (await findAsync(app, '#create-password'))[0]
  const confBox = (await findAsync(app, '#confirm-password'))[0]

  nativeInputValueSetter.call(pwBox, PASSWORD)
  pwBox.dispatchEvent(new Event('input', { bubbles: true}))

  nativeInputValueSetter.call(confBox, PASSWORD)
  confBox.dispatchEvent(new Event('input', { bubbles: true}))

  // Create Password
  const createButton = (await findAsync(app, 'button.first-time-flow__button'))[0]
  createButton.click()

  const created = (await findAsync(app, '.unique-image__title'))[0]
  assert.equal(created.textContent, 'Your unique account image', 'unique image screen')

  // Agree button
  const button = (await findAsync(app, 'button'))[0]
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
  const depositEthTitle = (await findAsync(app, '.page-container__title'))[0]
  assert.equal(depositEthTitle.textContent, 'Deposit Ether', 'deposit ether screen')
  ;(await findAsync(app, '.page-container__header-close')).click()

  const menu = (await findAsync(app, '.account-menu__icon'))[0]
  menu.click()

  const lock = (await findAsync(app, '.account-menu__logout-button'))[0]
  assert.ok(lock, 'Lock menu item found')
  lock.click()

  await timeout(1000)

  const pwBox2 = (await findAsync(app, '#password'))[0]
  pwBox2.focus()
  await timeout(1000)

  nativeInputValueSetter.call(pwBox2, PASSWORD)
  pwBox2.dispatchEvent(new Event('input', { bubbles: true}))

  const createButton2 = (await findAsync(app, 'button[type="submit"]'))[0]
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
