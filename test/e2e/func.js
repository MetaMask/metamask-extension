require('chromedriver')
require('geckodriver')
const Web3 = require('web3')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const pify = require('pify')
const prependFile = pify(require('prepend-file'))
const webdriver = require('selenium-webdriver')
const Command = require('selenium-webdriver/lib/command').Command
const assert = require('assert')
const { By, Key } = webdriver
const { screens, elements, NETWORKS } = require('./elements')

class Functions {
  constructor (driver) {
    this.driver = driver
  }

  async delay (time) {
    return new Promise(resolve => setTimeout(resolve, time))
  }

  async createModifiedTestBuild ({ browser, srcPath }) {
    // copy build to test-builds directory
    const extPath = path.resolve(`test-builds/${browser}`)
    await fs.ensureDir(extPath)
    await fs.copy(srcPath, extPath)
    // inject METAMASK_TEST_CONFIG setting default test network
    const config = { NetworkController: { provider: { type: 'localhost' } } }
    await prependFile(`${extPath}/background.js`, `window.METAMASK_TEST_CONFIG=${JSON.stringify(config)};\n`)
    return { extPath }
  }

  static async setupBrowserAndExtension ({ browser, extPath }) {
    let driver, extensionId, extensionUri
    if (browser === 'chrome') {
      driver = this.buildChromeWebDriver(extPath)
      this.driver = driver
      extensionId = await this.getExtensionIdChrome()
      extensionUri = `chrome-extension://${extensionId}/home.html`
    } else if (browser === 'firefox') {
      driver = this.buildFirefoxWebdriver()
      this.driver = driver
      await this.installWebExt(extPath)
      await this.delay(700)
      extensionId = await this.getExtensionIdFirefox()
      extensionUri = `moz-extension://${extensionId}/home.html`
    } else {
      throw new Error(`Unknown Browser "${browser}"`)
    }

    return { driver, extensionId, extensionUri }
  }

  static async buildChromeWebDriver (extPath) {
    const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-chrome-profile'))
    return new webdriver.Builder()
      .withCapabilities({
        chromeOptions: {
          args: [
            `load-extension=${extPath}`,
            `user-data-dir=${tmpProfile}`,
          ],
          binary: process.env.SELENIUM_CHROME_BINARY,
        },
      })
      .build()
  }

  static async buildFirefoxWebdriver () {
    return new webdriver.Builder().build()
  }

  async getExtensionIdChrome () {
    await this.driver.get('chrome://extensions')
    const extensionId = await this.driver.executeScript('return document.querySelector("extensions-manager").shadowRoot.querySelector("cr-view-manager extensions-item-list").shadowRoot.querySelector("extensions-item:nth-child(2)").getAttribute("id")')
    return extensionId
  }

  async getExtensionIdFirefox () {
    await this.driver.get('about:debugging#addons')
    const extensionId = await this.driver.findElement(By.css('dd.addon-target-info-content:nth-child(6) > span:nth-child(1)')).getText()
    return extensionId
  }

  async installWebExt (extension) {
    const cmd = await new Command('moz-install-web-ext')
      .setParameter('path', path.resolve(extension))
      .setParameter('temporary', true)

    await this.driver.getExecutor()
      .defineCommand(cmd.getName(), 'POST', '/session/:sessionId/moz/addon/install')

    return await this.driver.execute(cmd, 'installWebExt(' + extension + ')')
  }

  async verboseReportOnFailure ({ browser, title }) {
    const artifactDir = `./test-artifacts/${browser}/${title}`
    const filepathBase = `${artifactDir}/test-failure`
    await fs.ensureDir(artifactDir)
    const screenshot = await this.driver.takeScreenshot()
    await fs.writeFile(`${filepathBase}-screenshot.png`, screenshot, { encoding: 'base64' })
    const htmlSource = await this.driver.getPageSource()
    await fs.writeFile(`${filepathBase}-dom.html`, htmlSource)
  }

  async setProvider (network) {
    await this.delay(300)
    const menu = await this.waitUntilShowUp(screens.main.network)
    await menu.click()
    let counter
    switch (network) {
      case NETWORKS.POA:
        counter = 0
        break
      case NETWORKS.DAI:
        counter = 1
        break
      case NETWORKS.SOKOL:
        counter = 2
        break
      case NETWORKS.MAINNET:
        counter = 3
        break
      case NETWORKS.CLASSIC:
        counter = 4
        break
      case NETWORKS.ROPSTEN:
        counter = 5
        break
      case NETWORKS.KOVAN:
        counter = 6
        break
      case NETWORKS.RINKEBY:
        counter = 7
        break
      case NETWORKS.GOERLI:
        counter = 8
        break
      case NETWORKS.RSK:
        counter = 9
        break
      case NETWORKS.LOCALHOST:
        counter = 10
        break
      case NETWORKS.CUSTOM:
        counter = 11
        break
      default:
        counter = 10
    }
    await this.driver.executeScript("document.getElementsByClassName('dropdown-menu-item')[" + counter + '].click();')
  }

  async scrollTo (element) {
    try {
      await this.driver.executeScript('arguments[0].scrollIntoView();', element)
      return true
    } catch (err) {
      return false
    }
  }

  async click (element) {
    try {
      await element.sendKeys(Key.RETURN)
      return true
    } catch (err) {
      return false
    }
  }

  async clearField (field, number) {
    await this.click(field)
    if (number === undefined) number = 40
    for (let i = 0; i < number; i++) {
      await field.sendKeys(Key.BACK_SPACE)
    }
  }

  async waitUntilDisappear (by, Twait) {
    if (Twait === undefined) Twait = 10
    do {
      if (!await this.isElementDisplayed(by)) return true

    } while (Twait-- > 0)
    return false
  }

  async waitUntilShowUp (by, Twait) {
    if (Twait === undefined) Twait = 200
    do {
      await this.delay(100)
      if (await this.isElementDisplayed(by)) return await this.driver.findElement(by)
    } while (Twait-- > 0)
    return false
  }

  async waitUntilHasValue (element, Twait) {
    if (Twait === undefined) Twait = 200
    let text
    do {
      await this.delay(100)
      text = await element.getAttribute('value')
      if (text !== '') return text
    } while (Twait-- > 0)
    return false
  }

  async isElementDisplayed (by) {
    try {
      return await this.driver.findElement(by).isDisplayed()
    } catch (err) {
      return false
    }
  }

  async assertTokensNotDisplayed () {
    try {
      await this.delay(800)
      await this.waitUntilDisappear(elements.loader)
      assert.notEqual(await this.waitUntilShowUp(screens.main.tokens.amount), false, 'App is frozen')
      // Check tokens title
      let locator = screens.main.tokens.counter
      if (process.env.SELENIUM_BROWSER === 'firefox') locator = screens.main.tokens.counterFF
      const tokensCounter = await this.waitUntilShowUp(locator)
      assert.notEqual(tokensCounter, false, '\'Token\'s counter isn\'t displayed ')
      assert.equal(await tokensCounter.getText(), screens.main.tokens.textNoTokens, 'Unexpected token presents')
      // Check if token presents
      const tokens = await this.driver.findElements(screens.main.tokens.token)
      assert.equal(tokens.length, 0, 'Unexpected token presents')
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  async isDisabledAddInexistentToken (tokenAddress) {
    await this.delay(500)
    try {
      const tab = await this.waitUntilShowUp(screens.main.tokens.menu)
      await this.click(tab)
      await this.delay(1000)
      const button = await this.waitUntilShowUp(screens.main.tokens.buttonAdd2, 300)
      await this.click(button)
      let count = 20
      do {
        await this.delay(500)
        const tab = await this.waitUntilShowUp(screens.addToken.tab.custom, 10)
        try {
          await tab.click()
        } catch (err) {
        }
      }
      while ((await this.waitUntilShowUp(screens.addToken.custom.fields.contractAddress) === false) && (count-- > 0))
    } catch (err) {
    }
    const fieldAddress = await this.waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
    await this.clearField(fieldAddress)
    await fieldAddress.sendKeys(tokenAddress)

    const fieldSymbols = await this.waitUntilShowUp(screens.addToken.custom.fields.tokenSymbol)
    if (await fieldSymbols.isEnabled()) {
      console.log('field symbols enabled')
      return false
    }

    const fieldDecimals = await this.waitUntilShowUp(screens.addToken.custom.fields.tokenSymbol)
    if (await fieldDecimals.isEnabled()) {
      console.log('field decimals enabled')
      return false
    }
    const buttonAdd = await this.waitUntilShowUp(screens.addToken.custom.buttons.add)
    if (await buttonAdd.isEnabled()) {
      console.log('button add enabled')
      return false
    }
    const buttonCancel = await this.waitUntilShowUp(screens.addToken.custom.buttons.cancel)
    let counter = 20
    do {
      await this.delay(500)
      await this.click(buttonCancel)
    }
    while (((await this.waitUntilShowUp(screens.main.identicon)) === false) && (counter-- > 0))
    if (counter < 1) {
      console.log('button cancel doesn\'t work')
      return false
    }
    return true
  }

  async checkBrowserForConsoleErrors (driver) {
    const ignoredLogTypes = ['WARNING']
    const ignoredErrorMessages = [
      // React throws error warnings on "dataset", but still sets the data-* properties correctly
      'Warning: Unknown prop `dataset` on ',
      // Third-party Favicon 404s show up as errors
      'favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)',
      // React Development build - known issue blocked by test build sys
      'Warning: It looks like you\'re using a minified copy of the development build of React.',
      // Redux Development build - known issue blocked by test build sys
      'This means that you are running a slower development build of Redux.',
    ]
    const browserLogs = await driver.manage().logs().get('browser')
    const errorEntries = browserLogs.filter(entry => !ignoredLogTypes.includes(entry.level.toString()))
    const errorObjects = errorEntries.map(entry => entry.toJSON())
    // ignore all errors that contain a message in `ignoredErrorMessages`
    const matchedErrorObjects = errorObjects.filter(entry => !ignoredErrorMessages.some(message => entry.message.includes(message)))
    return matchedErrorObjects
  }

  async switchToLastPage () {
    try {
      const allHandles = await this.driver.getAllWindowHandles()
      await this.driver.switchTo().window(allHandles[allHandles.length - 1])
      let counter = 100
      do {
        await this.delay(500)
        if (await this.driver.getCurrentUrl() !== '') return true
      }
      while (counter-- > 0)
      return true
    } catch (err) {
      return false
    }
  }

  async switchToFirstPage () {
    try {
      const allHandles = await this.driver.getAllWindowHandles()
      console.log('allHandles.length ' + allHandles.length)
      await this.driver.switchTo().window(allHandles[0])
      let counter = 100
      do {
        await this.delay(500)
        if (await this.driver.getCurrentUrl() !== '') return true
      }
      while (counter-- > 0)
      return true
    } catch (err) {
      return false
    }
  }

  async waitUntilCurrentUrl () {
    try {
      let title
      let counter = 20
      do {
        await this.delay(500)
        title = await this.driver.getCurrentUrl()
      } while ((title === '') && (counter-- > 0))
      if (counter < 1) return false
      return title
    } catch (err) {
      console.log(err)
      return false
    }
  }

  async createToken (owner, { supply, name, decimals, ticker }, isDelayed) {

    const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545/'))
    const abi = [
      {
        'constant': true,
        'inputs': [],
        'name': 'name',
        'outputs': [
          {
            'name': '',
            'type': 'string',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': false,
        'inputs': [
          {
            'name': '_spender',
            'type': 'address',
          },
          {
            'name': '_value',
            'type': 'uint256',
          },
        ],
        'name': 'approve',
        'outputs': [
          {
            'name': 'success',
            'type': 'bool',
          },
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [],
        'name': 'totalSupply',
        'outputs': [
          {
            'name': '',
            'type': 'uint256',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': false,
        'inputs': [
          {
            'name': '_from',
            'type': 'address',
          },
          {
            'name': '_to',
            'type': 'address',
          },
          {
            'name': '_value',
            'type': 'uint256',
          },
        ],
        'name': 'transferFrom',
        'outputs': [
          {
            'name': 'success',
            'type': 'bool',
          },
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [
          {
            'name': '',
            'type': 'address',
          },
        ],
        'name': 'balances',
        'outputs': [
          {
            'name': '',
            'type': 'uint256',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [],
        'name': 'decimals',
        'outputs': [
          {
            'name': '',
            'type': 'uint8',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [
          {
            'name': '',
            'type': 'address',
          },
          {
            'name': '',
            'type': 'address',
          },
        ],
        'name': 'allowed',
        'outputs': [
          {
            'name': '',
            'type': 'uint256',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [
          {
            'name': '_owner',
            'type': 'address',
          },
        ],
        'name': 'balanceOf',
        'outputs': [
          {
            'name': 'balance',
            'type': 'uint256',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [],
        'name': 'symbol',
        'outputs': [
          {
            'name': '',
            'type': 'string',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': false,
        'inputs': [
          {
            'name': '_to',
            'type': 'address',
          },
          {
            'name': '_value',
            'type': 'uint256',
          },
        ],
        'name': 'transfer',
        'outputs': [
          {
            'name': 'success',
            'type': 'bool',
          },
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [
          {
            'name': '_owner',
            'type': 'address',
          },
          {
            'name': '_spender',
            'type': 'address',
          },
        ],
        'name': 'allowance',
        'outputs': [
          {
            'name': 'remaining',
            'type': 'uint256',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'inputs': [
          {
            'name': '_initialAmount',
            'type': 'uint256',
          },
          {
            'name': '_tokenName',
            'type': 'string',
          },
          {
            'name': '_decimalUnits',
            'type': 'uint8',
          },
          {
            'name': '_tokenSymbol',
            'type': 'string',
          },
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'constructor',
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': true,
            'name': '_from',
            'type': 'address',
          },
          {
            'indexed': true,
            'name': '_to',
            'type': 'address',
          },
          {
            'indexed': false,
            'name': '_value',
            'type': 'uint256',
          },
        ],
        'name': 'Transfer',
        'type': 'event',
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': true,
            'name': '_owner',
            'type': 'address',
          },
          {
            'indexed': true,
            'name': '_spender',
            'type': 'address',
          },
          {
            'indexed': false,
            'name': '_value',
            'type': 'uint256',
          },
        ],
        'name': 'Approval',
        'type': 'event',
      },
    ]
    const bin = '608060405234801561001057600080fd5b50604051610e30380380610e308339810180604052810190808051906020019092919080518201929190602001805190602001909291908051820192919050505083600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508360008190555082600390805190602001906100b29291906100ee565b5081600460006101000a81548160ff021916908360ff16021790555080600590805190602001906100e49291906100ee565b5050505050610193565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061012f57805160ff191683800117855561015d565b8280016001018555821561015d579182015b8281111561015c578251825591602001919060010190610141565b5b50905061016a919061016e565b5090565b61019091905b8082111561018c576000816000905550600101610174565b5090565b90565b610c8e806101a26000396000f3006080604052600436106100af576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806306fdde03146100b4578063095ea7b31461014457806318160ddd146101a957806323b872dd146101d457806327e235e314610259578063313ce567146102b05780635c658165146102e157806370a082311461035857806395d89b41146103af578063a9059cbb1461043f578063dd62ed3e146104a4575b600080fd5b3480156100c057600080fd5b506100c961051b565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156101095780820151818401526020810190506100ee565b50505050905090810190601f1680156101365780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561015057600080fd5b5061018f600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506105b9565b604051808215151515815260200191505060405180910390f35b3480156101b557600080fd5b506101be6106ab565b6040518082815260200191505060405180910390f35b3480156101e057600080fd5b5061023f600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506106b1565b604051808215151515815260200191505060405180910390f35b34801561026557600080fd5b5061029a600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061094b565b6040518082815260200191505060405180910390f35b3480156102bc57600080fd5b506102c5610963565b604051808260ff1660ff16815260200191505060405180910390f35b3480156102ed57600080fd5b50610342600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610976565b6040518082815260200191505060405180910390f35b34801561036457600080fd5b50610399600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061099b565b6040518082815260200191505060405180910390f35b3480156103bb57600080fd5b506103c46109e4565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156104045780820151818401526020810190506103e9565b50505050905090810190601f1680156104315780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561044b57600080fd5b5061048a600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610a82565b604051808215151515815260200191505060405180910390f35b3480156104b057600080fd5b50610505600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610bdb565b6040518082815260200191505060405180910390f35b60038054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156105b15780601f10610586576101008083540402835291602001916105b1565b820191906000526020600020905b81548152906001019060200180831161059457829003601f168201915b505050505081565b600081600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b60005481565b600080600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101580156107825750828110155b151561078d57600080fd5b82600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254019250508190555082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8110156108da5782600260008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055505b8373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef856040518082815260200191505060405180910390a360019150509392505050565b60016020528060005260406000206000915090505481565b600460009054906101000a900460ff1681565b6002602052816000526040600020602052806000526040600020600091509150505481565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60058054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610a7a5780601f10610a4f57610100808354040283529160200191610a7a565b820191906000526020600020905b815481529060010190602001808311610a5d57829003601f168201915b505050505081565b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205410151515610ad257600080fd5b81600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555081600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a36001905092915050565b6000600260008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050929150505600a165627a7a72305820979c62ae45244f66d713b9272cd9a32a6b8c2ba4778ec9fb58a39dc893cb9cde0029'

    const tokenContract = web3.eth.contract(abi)
    const contractInstance = await tokenContract.new(supply, name, decimals, ticker, {
      data: bin, from: owner, gas: 4500000, function (err, tokenContract) {
        if (err) {
          console.log('Error of token creation: ' + err)
        }
      },
    })
    if (isDelayed) await this.delay(5000)
    return contractInstance.address
  }

  async executeTransferMethod (executor, address) {
    try {
      const buttonExecute = await this.waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
      assert.notEqual(buttonExecute, false, "button doesn't displayed")
      await buttonExecute.click()
      // Select method transfer
      const menu = await this.waitUntilShowUp(screens.executeMethod.selectArrow)
      await menu.click()
      await this.waitUntilShowUp(screens.executeMethod.items)
      const list = await this.driver.findElements(screens.executeMethod.items)
      await list[21].click()
      // Fill out value
      await this.waitUntilShowUp(screens.executeMethod.fieldParameter)
      const fields = await this.driver.findElements(screens.executeMethod.fieldParameter)
      assert.notEqual(fields[1], false, "field value isn't displayed")
      await fields[1].sendKeys('1')
      // Fill out address
      await this.clearField(fields[0], 100)
      await fields[0].sendKeys(address)
      assert.notEqual(fields[0], false, "field address isn't displayed")
      // Click button next
      const buttonNext = await this.waitUntilShowUp(screens.executeMethod.buttonNext)
      assert.notEqual(buttonNext, false, "button 'Next' isn't displayed")
      await buttonNext.click()
      // Select executor
      await this.waitUntilShowUp(screens.chooseContractExecutor.account)
      const accounts = await this.driver.findElements(screens.chooseContractExecutor.account)
      const account = accounts[executor + 1]
      await account.click()
      // Open confirm transaction
      const button = await this.waitUntilShowUp(screens.chooseContractExecutor.buttonNext)
      await button.click()
      return true
    } catch (err) {
      return false
    }
  }
}
module.exports.Functions = Functions


