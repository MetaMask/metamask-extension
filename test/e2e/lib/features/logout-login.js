module.exports = {
  logout,
  login,
}

const testPassword = 'correct horse battery staple'

async function logout (page) {
  await page.waitFor('.account-menu__icon')
  await page.click('.account-menu__icon')
  await page.waitFor('.menu.account-menu')
  await page.click('.account-menu__logout-button')
  await page.waitFor('.unlock-page')
}

async function login (page) {
  await page.waitFor('.unlock-page')
  await page.type('.unlock-page__form input#password', testPassword)
  await page.keyboard.press('Enter')
  await page.waitFor(500)
}
