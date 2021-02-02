import Conflux from 'js-conflux-sdk/src/Conflux'
import { MAINNET, TESTNET } from './network/enums'
import { toChecksumAddress } from 'cfx-util'
import { fakeContractMapForTest } from './fakeContractMapForTest'
// By default, poll every 3 minutes
const DEFAULT_INTERVAL = 180 * 1000
const METAMASK_DEBUG = process.env.METAMASK_DEBUG
const IN_TEST =
  process.env.IN_TEST === 'true' ||
  process.env.METAMASK_ENVIRONMEN === 'testing'
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    payable: false,
    type: 'function',
  },
]
import SINGLE_CALL_BALANCES_ABI from './cfx-single-call-balance-checker-abi'
import { SINGLE_CALL_BALANCES_ADDRESS } from './network/contract-addresses.js'
import {
  hexToBase32,
  base32ToHex,
  isLikeBase32Address,
  isValidHexAddress,
  isValidBase32Address,
} from '../cip37'

const CONFLUX_SCAN_CONTRACT_MANAGER_LIST_API = '/v1/token'

function getScanUrl(network) {
  if (network.store.getState().provider.type === MAINNET) {
    return 'https://confluxscan.io'
  } else if (network.store.getState().provider.type === TESTNET) {
    return 'https://testnet.confluxscan.io'
  }
}

/**
 * A controller that polls for token exchange
 * rates based on a user's current token list
 */
class DetectTokensController {
  /**
   * Creates a DetectTokensController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor({
    interval = DEFAULT_INTERVAL,
    preferences,
    network,
    keyringMemStore,
  } = {}) {
    this.preferences = preferences
    this.interval = interval
    this.network = network
    this.keyringMemStore = keyringMemStore
  }

  async refreshCachedTokenList() {
    const endpoint = getScanUrl(this._network)
    if (!endpoint) {
      if (METAMASK_DEBUG || IN_TEST) {
        return fakeContractMapForTest
      }
      return {}
    }

    const res = await fetch(
      endpoint +
        CONFLUX_SCAN_CONTRACT_MANAGER_LIST_API +
        '?limit=100&skip=0&fields=icon'
    ).catch(() => {})

    if (!res || !res.ok) {
      console.warn(`Failed to fetch token whitelist from confluxscan`)
      return {}
    }

    const { list: tokenList } = await res.json()

    const validTokens = await Promise.all(
      tokenList.reduce((acc, token) => {
        if (token && token.symbol) {
          acc.push(token)
        }
        return acc
      }, [])
    )

    const contractMap = {}
    const network = parseInt(this._network.getNetworkConfig().network, 10)
    validTokens.forEach(token => {
      let { address } = token
      const { name, icon, symbol, decimals, isERC721 } = token
      let base32Address
      if (
        isLikeBase32Address(address) &&
        isValidBase32Address(address, network, 'contract')
      ) {
        base32Address = address
        address = base32ToHex(base32Address)
      } else if (isValidHexAddress(address)) {
        base32Address = hexToBase32(address, network)
      } else {
        return
      }

      const checkSumedAddress = toChecksumAddress(address)
      contractMap[checkSumedAddress] = {
        base32Address,
        address: checkSumedAddress,
        name: name,
        symbol,
        decimals: parseInt(decimals, 10) || 0,
        logo: icon || undefined,
        erc20: true,
        erc721: isERC721,
      }
    })
    this._preferences.store.updateState({ trustedTokenMap: contractMap })
    return contractMap
  }

  /**
   * For each token in eth-contract-metada, find check selectedAddress balance.
   *
   */
  async detectNewTokens() {
    if (!this.isActive) {
      return
    }
    if (
      this._network.store.getState().provider.type !== MAINNET &&
      this._network.store.getState().provider.type !== TESTNET
    ) {
      return
    }
    const tokensToDetect = []
    this.cfx.provider.url = this._network._provider._confluxWebProvider.url
    const contracts = this._preferences.store.getState().trustedTokenMap
    for (const contractAddress in contracts) {
      if (
        contracts[contractAddress].erc20 &&
        !this.tokenAddresses.includes(contractAddress.toLowerCase())
      ) {
        tokensToDetect.push(contractAddress)
      }
    }
    if (!tokensToDetect.length) {
      return
    }

    const ethContract = this.cfx.Contract({
      abi: SINGLE_CALL_BALANCES_ABI,
      address: SINGLE_CALL_BALANCES_ADDRESS,
    })
    try {
      const balances = await ethContract.balances(
        [this.selectedAddress],
        tokensToDetect
      )
      tokensToDetect.forEach((tokenAddress, index) => {
        const balance = balances[index]
        if (balance && balance.toString() !== '0') {
          this._preferences.addToken(
            tokenAddress,
            contracts[tokenAddress].symbol,
            contracts[tokenAddress].decimals
          )
        }
      })
    } catch (error) {
      // warn(
      //   `MetaMask - DetectTokensController single call balance fetch failed`,
      //   error
      // )
      return
    }
  }

  /**
   * Find if selectedAddress has tokens with contract in contractAddress.
   *
   * @param {string} contractAddress - Hex address of the token contract to explore.
   * @returns {boolean} - If balance is detected, token is added.
   *
   */
  async detectTokenBalance(contractAddress) {
    const ethContract = this.cfx.Contract({
      abi: ERC20_ABI,
      address: contractAddress,
    })
    const contracts = this._preferences.store.getState().trustedTokenMap
    let result
    try {
      result = await ethContract.balanceOf(this.selectedAddress)
    } catch (err) {}

    if (!result) {
      return
    }
    if (result.isZero()) {
      return
    }

    this._preferences.addToken(
      contractAddress,
      contracts[contractAddress].symbol,
      contracts[contractAddress].decimals
    )
  }

  /**
   * Restart token detection polling period and call detectNewTokens
   * in case of address change or user session initialization.
   *
   */
  restartTokenDetection() {
    if (!(this.isActive && this.selectedAddress)) {
      return
    }
    this.refreshCachedTokenList().then(() => {
      this.detectNewTokens()
      this.interval = DEFAULT_INTERVAL
    })
  }

  /**
   * @type {Number}
   */
  set interval(interval) {
    this._handle && clearInterval(this._handle)
    if (!interval) {
      return
    }
    this._handle = setInterval(() => {
      this.detectNewTokens()
    }, interval)
  }

  /**
   * In setter when selectedAddress is changed, detectNewTokens and restart polling
   * @type {Object}
   */
  set preferences(preferences) {
    if (!preferences) {
      return
    }
    this._preferences = preferences
    preferences.store.subscribe(({ tokens = [] }) => {
      this.tokenAddresses = tokens.map(obj => {
        return obj.address
      })
    })
    preferences.store.subscribe(({ selectedAddress }) => {
      if (this.selectedAddress !== selectedAddress) {
        this.selectedAddress = selectedAddress
        this.restartTokenDetection()
      }
    })
  }

  /**
   * @type {Object}
   */
  set network(network) {
    if (!network) {
      return
    }
    this._network = network
    this._network.on('networkDidChange', net => {
      if (net !== MAINNET && net !== TESTNET) {
        return
      }
      this.restartTokenDetection()
    })
    this.cfx = new Conflux(network._provider._confluxWebProvider)
    this.cfx.networkId = parseInt(network.getNetworkConfig().network, 10)
  }

  /**
   * In setter when isUnlocked is updated to true, detectNewTokens and restart polling
   * @type {Object}
   */
  set keyringMemStore(keyringMemStore) {
    if (!keyringMemStore) {
      return
    }
    this._keyringMemStore = keyringMemStore
    this._keyringMemStore.subscribe(({ isUnlocked }) => {
      if (this.isUnlocked !== isUnlocked) {
        this.isUnlocked = isUnlocked
        if (isUnlocked) {
          this.restartTokenDetection()
        }
      }
    })
  }

  /**
   * Internal isActive state
   * @type {Object}
   */
  get isActive() {
    return this.isOpen && this.isUnlocked
  }
}

export default DetectTokensController
