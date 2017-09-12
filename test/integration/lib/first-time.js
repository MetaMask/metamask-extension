const PASSWORD = 'password123'

QUnit.module('first time usage')

QUnit.test('render init screen', (assert) => {
  const done = assert.async()
  runFirstTimeUsageTest(assert).then(done).catch((err) => {
    assert.notOk(err, 'Should not error')
    done()
  })
})

QUnit.testDone(({ module, name, total, passed, failed, skipped, todo, runtime }) => {
  if (failed > 0) {
    const app = $('iframe').contents()
    console.warn('Test failures - dumping DOM:')
    console.log(app.innerHTML)
  }
})

async function runFirstTimeUsageTest(assert, done) {
  await wait()

  const app = $('iframe').contents().find('#app-content .mock-app-root')

  // recurse notices
  while (true) {
    const button = app.find('button')
    if (button.html() === 'Accept') {
      // still notices to accept
      const termsPage = app.find('.markdown')[0]
      termsPage.scrollTop = termsPage.scrollHeight
      await wait()
      button.click()
      await wait()
    } else {
      // exit loop
      break
    }
  }

  await wait()

  // Scroll through terms
  const title = app.find('h1').text()
  assert.equal(title, 'MetaMask', 'title screen')

  // enter password
  const pwBox = app.find('#password-box')[0]
  const confBox = app.find('#password-box-confirm')[0]
  pwBox.value = PASSWORD
  confBox.value = PASSWORD

  await wait()

  // create vault
  const createButton = app.find('button.primary')[0]
  createButton.click()

  await wait(1500)

  const created = app.find('h3')[0]
  assert.equal(created.textContent, 'Vault Created', 'Vault created screen')

  // Agree button
  const button = app.find('button')[0]
  assert.ok(button, 'button present')
  button.click()

  await wait(1000)

  const detail = app.find('.account-detail-section')[0]
  assert.ok(detail, 'Account detail section loaded.')

  const sandwich = app.find('.sandwich-expando')[0]
  sandwich.click()

  await wait()

  const menu = app.find('.menu-droppo')[0]
  const children = menu.children
  const lock = children[children.length - 2]
  assert.ok(lock, 'Lock menu item found')
  lock.click()

  await wait(1000)

  const pwBox2 = app.find('#password-box')[0]
  pwBox2.value = PASSWORD

  const createButton2 = app.find('button.primary')[0]
  createButton2.click()

  await wait(1000)

  const detail2 = app.find('.account-detail-section')[0]
  assert.ok(detail2, 'Account detail section loaded again.')

  await wait()

  // open account settings dropdown
  const qrButton = app.find('.fa.fa-ellipsis-h')[0]
  qrButton.click()

  await wait(1000)

  // qr code item
  const qrButton2 = app.find('.dropdown-menu-item')[1]
  qrButton2.click()

  await wait(1000)

  const qrHeader = app.find('.qr-header')[0]
  const qrContainer = app.find('#qr-container')[0]
  assert.equal(qrHeader.textContent, 'Account 1', 'Should show account label.')
  assert.ok(qrContainer, 'QR Container found')

  await wait()

  const networkMenu = app.find('.network-indicator')[0]
  networkMenu.click()

  await wait()

  const networkMenu2 = app.find('.network-indicator')[0]
  const children2 = networkMenu2.children
  children2.length[3]
  assert.ok(children2, 'All network options present')
}