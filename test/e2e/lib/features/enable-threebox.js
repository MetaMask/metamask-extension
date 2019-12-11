export default async function enableThreebox (page) {
  await page.click('.account-menu__icon')
  await page.waitFor('.menu.account-menu')

  const settings = `//div[contains(text(), 'Settings')]`
  const settingsButton = await page.$x(settings)
  await settingsButton[0].click()

  const advanced = `//div[contains(text(), 'Advanced)]`
  const advancedButton = await page.$x(advanced)
  await advancedButton[0].click()

  const toggleButtons = await page.$x('.toggle-button')
  const toggle = await toggleButtons[4].$('div')
  await toggle.click()

}
