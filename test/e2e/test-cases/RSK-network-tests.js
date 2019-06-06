const assert = require('assert')
const { screens, elements, NETWORKS } = require('../elements')

 const RSKNetworkTests = async (f, account1) => {
	it('connects to RSK mainnet', async function () {
		await f.setProvider(NETWORKS.RSK)
		await f.delay(2000)
	})

	// it('connects to RSK testnet', async function () {
	// 	await f.setProvider(NETWORKS.RSK_TESTNET)
	// 	await f.delay(2000)
	// })

	// it('checks zero exchange rate for RSK testnet', async function () {
	// 	const balanceField = await f.waitUntilShowUp(screens.main.balance)
	// 	const balanceUSDField = await f.waitUntilShowUp(screens.main.balanceUSD)
	// 	await f.delay(2000)
	// 	const balance = await balanceField.getText()
	// 	const balanceUSD = await balanceUSDField.getText()
	// 	console.log('Balance = ' + parseFloat(balance))
	// 	console.log('balanceUSD = ' + parseFloat(balanceUSD))
	// 	assert.equal(parseFloat(balance) > 0.0001, true, 'Balance of account ' + account1 + ' is TOO LOW in RSK testnet !!! Please refill it!!!!')
	// 	assert.equal(parseFloat(balanceUSD), 0, 'USD balance of account is not zero')
	// })

	// it('opens RSK faucet', async function () {
	// 	await f.waitUntilShowUp(screens.main.buttons.buyRSK)
	// 	const buttons = await f.driver.findElements(screens.main.buttons.buyRSK)
	// 	assert.equal(buttons.length, 1, 'main screen isn\'t displayed')
	// 	const buyButton = buttons[0]
	// 	const buyButtonText = await buyButton.getText()
	// 	assert.equal(buyButtonText, 'Buy', 'button has incorrect name')
	// 	await buyButton.click()
	// 	await f.delay(2000)
	// 	const title = await f.waitUntilShowUp(screens.buyEther.title)
	// 	assert.equal(await title.getText(), 'Buy RBTC', "screen 'Buy RBTC' has incorrect title text")
	// 	await f.waitUntilShowUp(screens.buyEther.faucetLinkRSK)
	// 	const faucetButtons = await f.driver.findElements(screens.buyEther.faucetLinkRSK)
	// 	assert.equal(faucetButtons.length, 1, 'there is no faucet button on the screen')
	// 	const faucetLinkButton = faucetButtons[0]
	// 	assert.equal(await faucetLinkButton.getText(), 'RSK Testnet Test Faucet', "screen 'Buy RSK' has incorrect name for faucet link")
	// 	await faucetLinkButton.click()
	// 	await f.delay(3000)
	// 	const [tab0, tab1] = await f.driver.getAllWindowHandles()
	// 	await f.driver.switchTo().window(tab1)
	// 	const faucetLink = await f.driver.getCurrentUrl()
	// 	assert.equal(faucetLink, 'https://faucet.testnet.rsk.co/', 'Incorrect faucet link for RSK network')
	// 	await f.driver.close()
	// 	await f.driver.switchTo().window(tab0)
	// 	const arrow = await f.waitUntilShowUp(elements.buttonArrow)
	// 	await arrow.click()
	// 	await f.delay(2000)
	// })

	// it('opens send transaction screen', async function () {
	// 	const sendButton = await f.waitUntilShowUp(screens.main.buttons.sendRSK)
	// 	assert.equal(await sendButton.getText(), screens.main.buttons.sendText)
	// 	await f.click(sendButton)
	// })

	// it('adds recipient address and amount', async function () {
	// 	const sendTranscationScreen = await f.waitUntilShowUp(screens.sendTransaction.title)
	// 	assert.equal(await sendTranscationScreen.getText(), screens.sendTransaction.titleText, 'Transaction screen has incorrect titlr')
	// 	const inputAddress = await f.waitUntilShowUp(screens.sendTransaction.field.address)
	// 	const inputAmmount = await f.waitUntilShowUp(screens.sendTransaction.field.amount)
	// 	await inputAddress.sendKeys(account1)
	// 	await f.clearField(inputAmmount)
	// 	await inputAmmount.sendKeys('0.000001')
	// 	const button = await f.waitUntilShowUp(screens.sendTransaction.buttonNext)
	// 	assert.equal(await button.getText(), 'Next', 'button has incorrect name')
	// 	await f.click(button)
	// })

	// it('confirms transaction', async function () {
	// 	const inputGasLimit = await f.waitUntilShowUp(screens.confirmTransaction.fields.gasLimit)
	// 	await f.clearField(inputGasLimit)
	// 	await inputGasLimit.sendKeys('31500')
	// 	const button = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
	// 	assert.equal(await button.getAttribute('value'), 'Submit', 'button has incorrect name')
	// 	await f.click(button)
	// })

	// it('finds the transaction in the transactions list', async function () {
	// 	const transactionAmount = await f.waitUntilShowUp(screens.main.transactionList)
	// 	assert.equal(await transactionAmount.getText(), '<0.001')
	// })
}

 module.exports = RSKNetworkTests
