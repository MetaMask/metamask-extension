export default async function accountInfo (page) {

  await page.waitFor('.account-and-transaction-details')
  await page.click('.account-details__details-button')
  await page.waitFor('.qr-wrapper')

}
