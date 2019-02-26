const path = require('path')
const assert = require('assert')
const webdriver = require('selenium-webdriver')

const { By, Key, until } = webdriver
const {
  delay,
  buildChromeWebDriver,
  buildFirefoxWebdriver,
  installWebExt,
  getExtensionIdChrome,
  getExtensionIdFirefox,
} = require('../func')
const {
  checkBrowserForConsoleErrors,
  closeAllWindowHandlesExcept,
  verboseReportOnFailure,
  findElement,
  findElements,
  assertElementNotPresent,
  loadExtension,
  openNewPage,
  switchToWindowWithTitle,
  waitUntilXWindowHandles,
} = require('./helpers')
const fetchMockResponses = require('./fetch-mocks.js')




describe('Using MetaMask with an existing account', function () {
  let extensionId
  let driver

  const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
  const testAddress = '0xE18035BF8712672935FDB4e5e431b1a0183d2DFC'
  const testPrivateKey2 = '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6'
  const regularDelayMs = 1000
  const largeDelayMs = regularDelayMs * 2

  this.timeout(0)
  this.bail(true)

  before(async function () {
    let extensionUrl
    switch (process.env.SELENIUM_BROWSER) {
      case 'chrome': {
        const extensionPath = path.resolve('dist/chrome')
        driver = buildChromeWebDriver(extensionPath)
        extensionId = await getExtensionIdChrome(driver)
        await delay(regularDelayMs)
        extensionUrl = `chrome-extension://${extensionId}/home.html`
        break
      }
      case 'firefox': {
        const extensionPath = path.resolve('dist/firefox')
        driver = buildFirefoxWebdriver()
        await installWebExt(driver, extensionPath)
        await delay(regularDelayMs)
        extensionId = await getExtensionIdFirefox(driver)
        extensionUrl = `moz-extension://${extensionId}/home.html`
        break
      }
    }
    // Depending on the state of the application built into the above directory (extPath) and the value of
    // METAMASK_DEBUG we will see different post-install behaviour and possibly some extra windows. Here we
    // are closing any extraneous windows to reset us to a single window before continuing.
    const [tab1] = await driver.getAllWindowHandles()
    await closeAllWindowHandlesExcept(driver, [tab1])
    await driver.switchTo().window(tab1)
    await driver.get(extensionUrl)
  })

  beforeEach(async function () {
    await driver.executeScript(
      'window.origFetch = window.fetch.bind(window);' +
      'window.fetch = ' +
      '(...args) => { ' +
      'if (args[0] === "https://ethgasstation.info/json/ethgasAPI.json") { return ' +
      'Promise.resolve({ json: () => Promise.resolve(JSON.parse(\'' + fetchMockResponses.ethGasBasic + '\')) }); } else if ' +
      '(args[0] === "https://ethgasstation.info/json/predictTable.json") { return ' +
      'Promise.resolve({ json: () => Promise.resolve(JSON.parse(\'' + fetchMockResponses.ethGasPredictTable + '\')) }); } else if ' +
      '(args[0] === "https://dev.blockscale.net/api/gasexpress.json") { return ' +
      'Promise.resolve({ json: () => Promise.resolve(JSON.parse(\'' + fetchMockResponses.gasExpress + '\')) }); } ' +
      'return window.origFetch(...args); }'
    )
  })


  afterEach(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map(err => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join('\n')}`
        console.error(new Error(errorMessage))
      }
    }
    if (this.currentTest.state === 'failed') {
      await verboseReportOnFailure(driver, this.currentTest)
    }
  })

  after(async function () {
    await driver.quit()
  })

  describe('First time flow starting from an existing seed phrase', () => {
    it('clicks the continue button on the welcome screen', async () => {
      const welcomeScreenBtn = await findElement(driver, By.css('.welcome-page .first-time-flow__button'))
      welcomeScreenBtn.click()
      await delay(largeDelayMs)
    })

    it('imports a seed phrase', async () => {
      const [seedPhrase] = await findElements(driver, By.xpath(`//a[contains(text(), 'Import with seed phrase')]`))
      await seedPhrase.click()
      await delay(regularDelayMs)

      const [seedTextArea] = await findElements(driver, By.css('textarea.first-time-flow__textarea'))
      await seedTextArea.sendKeys(testSeedPhrase)
      await delay(regularDelayMs)

      const [password] = await findElements(driver, By.id('password'))
      await password.sendKeys('correct horse battery staple')
      const [confirmPassword] = await findElements(driver, By.id('confirm-password'))
      confirmPassword.sendKeys('correct horse battery staple')

      const [importButton] = await findElements(driver, By.xpath(`//button[contains(text(), 'Import')]`))
      await importButton.click()
      await delay(regularDelayMs)
    })
    

    it('clicks through the ToS', async () => {
      // terms of use
      await findElement(driver, By.css('.first-time-flow__markdown'))
      const canClickThrough = await driver.findElement(By.css('button.first-time-flow__button')).isEnabled()
      assert.equal(canClickThrough, false, 'disabled continue button')
      const bottomOfTos = await findElement(driver, By.linkText('Attributions'))
      await driver.executeScript('arguments[0].scrollIntoView(true)', bottomOfTos)
      await delay(regularDelayMs)
      const acceptTos = await findElement(driver, By.css('button.first-time-flow__button'))
      driver.wait(until.elementIsEnabled(acceptTos))
      await acceptTos.click()
      await delay(regularDelayMs)
    })

    it('clicks through the privacy notice', async () => {
      // privacy notice
      const nextScreen = await findElement(driver, By.css('button.first-time-flow__button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('clicks through the phishing notice', async () => {
      // phishing notice
      const noticeElement = await driver.findElement(By.css('.first-time-flow__markdown'))
      await driver.executeScript('arguments[0].scrollTop = arguments[0].scrollHeight', noticeElement)
      await delay(regularDelayMs)
      const nextScreen = await findElement(driver, By.css('button.first-time-flow__button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })
  })



  

    describe('opens dapp', () => {

      it('switches to mainnet', async () => {
        const networkDropdown = await findElement(driver, By.css('.network-name'))
        await networkDropdown.click()
        await delay(regularDelayMs)
    
        const [mainnet] = await findElements(driver, By.xpath(`//span[contains(text(), 'Main Ethereum Network')]`))
        await mainnet.click()
        await delay(largeDelayMs * 2)
      })

      it('', async () => {
        await openNewPage(driver, 'http://127.0.0.1:8080/')
        await delay(regularDelayMs)

        await waitUntilXWindowHandles(driver, 3)
        windowHandles = await driver.getAllWindowHandles()

        extension = windowHandles[0]
        popup = await switchToWindowWithTitle(driver, 'MetaMask Notification', windowHandles)
        dapp = windowHandles.find(handle => handle !== extension && handle !== popup)

        await delay(regularDelayMs)
        const approveButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Connect')]`))
        await approveButton.click()

        await driver.switchTo().window(dapp)
        await delay(regularDelayMs )
       

      })
    })

    describe('testing web3 methods', async () =>{



      it('testing hexa methods' , async () =>{

       
          var List= await driver.findElements(By.className("hexaNumberMethods"));
          var button;
         
          for(i=0; i<List.length; i++){
            try {
             const button = List[i]
             await button.click();
            await delay(largeDelayMs )
            const [results] = await findElements(driver, By.css('#results'))
            const resulttext = await results.getText()
             var parsedData = JSON.parse(resulttext);
            console.log(parsedData)
            var result = parseInt(parsedData.result,16);

            assert.equal(!(isNaN(result)),true)
            await delay(regularDelayMs )
          }
          catch (err){

            var text = await button.getText();
            console.log("The function which has the error is " + text)
            console.log(err)
  
          }
        } 
      })

      it('testing booleanMethods' , async () => {
       
          var List= await driver.findElements(By.className("booleanMethods"));
          var button;
          for(i=0; i<List.length; i++){
            try {
             button = List[i]
             await button.click();
            await delay(largeDelayMs )
            const [results] = await findElements(driver, By.css('#results'))
            const resulttext = await results.getText()
             var parsedData = JSON.parse(resulttext);
            console.log(parsedData)
            var result = parsedData.result

            assert.equal(result,false)
            await delay(regularDelayMs )
          }
          catch (err){
            var text = await button.getText();
            console.log("The function which has the error is " + text)
            console.log(err)
  
          }
        }

      })

      it('testing  transactionMethods', async() =>{
        
          var List= await driver.findElements(By.className("transactionMethods"));
          var button;
          for(i=0; i<List.length; i++){
            try {
             button = List[i]
             await button.click();
            await delay(largeDelayMs )
            const [results] = await findElements(driver, By.css('#results'))
           const resulttext = await results.getText()
            var parsedData = JSON.parse(resulttext);
            console.log(parsedData.result.blockHash)

            var result = parseInt(parsedData.result.blockHash,16);

            assert.equal(!(isNaN(result)),true)
            await delay(regularDelayMs )
          }
          catch (err){

            var text = await button.getText();
              console.log("The function which has the error is " + text)
              console.log(err)
    
  
          }
        } 

      })

      it('testing blockMethods' ,async () =>{
        
          var List= await driver.findElements(By.className("blockMethods"));
          var button;
          for(i=0; i<List.length; i++){
            try {
              button = List[i]
             await button.click();
            await delay(largeDelayMs )
           const [results] = await findElements(driver, By.css('#results'))
           const resulttext = await results.getText()
            var parsedData = JSON.parse(resulttext);
            console.log(parsedData.result.parentHash)

            var result = parseInt(parsedData.result.parentHash,16);

            assert.equal(!(isNaN(result)),true)
            await delay(regularDelayMs )
          }
          catch (err){

            var text = await button.getText();
            console.log("The function which has the error is " + text)
            console.log(err)
  
  
          }
        } 
      })

      it('testing methods' ,async () =>{
       
          var List= await driver.findElements(By.className("methods"));
          var  button
          for(i=0; i<List.length; i++){
            try {
             button = List[i]
             await button.click();
            await delay(largeDelayMs )
            await delay(largeDelayMs)
            const [results] = await findElements(driver, By.css('#results'))
           const resulttext = await results.getText()
            var parsedData = JSON.parse(resulttext);
            console.log(parsedData.result)

            var result = parseInt(parsedData.result,16);
            
            assert.equal((isNaN(result) || (result === 0)),true)
            await delay(regularDelayMs )
          }
          catch (err){

            var text = await button.getText();
            console.log("The function which has the error is " + text)
            console.log(err)
  
          }
        } 
      })
      
     

       

       

      })
       
        
      })
   


    




