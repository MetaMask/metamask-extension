const inherits = require('util').inherits
const Component = require('react').Component
const classnames = require('classnames')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const Fuse = require('fuse.js')
const contractMap = require('eth-contract-metadata')
const contractList = Object.entries(contractMap).map(([ _, tokenData]) => tokenData)
const fuse = new Fuse(contractList, {
    shouldSort: true,
    threshold: 0.45,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['address', 'name', 'symbol'],
})
const actions = require('./actions')
// const Tooltip = require('./components/tooltip.js')


const ethUtil = require('ethereumjs-util')
const abi = require('human-standard-token-abi')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')

const emptyAddr = '0x0000000000000000000000000000000000000000'

module.exports = connect(mapStateToProps, mapDispatchToProps)(AddTokenScreen)

function mapStateToProps (state) {
  return {
    identities: state.metamask.identities,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    goHome: () => dispatch(actions.goHome()),
  }
}

inherits(AddTokenScreen, Component)
function AddTokenScreen () {
  this.state = {
    // warning: null,
    // address: null,
    // symbol: 'TOKEN',
    // decimals: 18,
    customAddress: '',
    customSymbol: '',
    customDecimals: 0,
    searchQuery: '',
    isCollapsed: true,
    selectedToken: {},
  }
  this.tokenAddressDidChange = this.tokenAddressDidChange.bind(this)
  Component.call(this)
}

AddTokenScreen.prototype.toggleToken = function (symbol) {
  const { selectedToken } = this.state
  const { [symbol]: isSelected } = selectedToken
  this.setState({
    selectedToken: {
      ...selectedToken,
      [symbol]: !isSelected,
    },
  })
}

AddTokenScreen.prototype.renderCustomForm = function () {
  const { customAddress, customSymbol, customDecimals } = this.state

  return !this.state.isCollapsed && (
    h('div.add-token__add-custom-form', [
      h('div.add-token__add-custom-field', [
        h('div.add-token__add-custom-label', 'Token Address'),
        h('input.add-token__add-custom-input', {
          type: 'text',
          onChange: this.tokenAddressDidChange,
          value: customAddress,
        }),
      ]),
      h('div.add-token__add-custom-field', [
        h('div.add-token__add-custom-label', 'Token Symbol'),
        h('input.add-token__add-custom-input', {
          type: 'text',
          value: customSymbol,
          disabled: true,
        }),
      ]),
      h('div.add-token__add-custom-field', [
        h('div.add-token__add-custom-label', 'Decimals of Precision'),
        h('input.add-token__add-custom-input', {
          type: 'number',
          value: customDecimals,
          disabled: true,
        }),
      ]),
    ])
  )
}

AddTokenScreen.prototype.renderTokenList = function () {
  const { searchQuery = '', selectedToken } = this.state
  const results = searchQuery
    ? fuse.search(searchQuery) || []
    : contractList

  return Array(6).fill(undefined)
    .map((_, i) => {
      const { logo, symbol, name } = results[i] || {}
      return Boolean(logo || symbol || name) && (
        h('div.add-token__token-wrapper', {
          className: classnames('add-token__token-wrapper', {
            'add-token__token-wrapper--selected': selectedToken[symbol],
          }),
          onClick: () => this.toggleToken(symbol),
        }, [
          h('div.add-token__token-icon', {
            style: {
              backgroundImage: `url(images/contract/${logo})`,
            },
          }),
          h('div.add-token__token-data', [
            h('div.add-token__token-symbol', symbol),
            h('div.add-token__token-name', name),
          ]),
        ])
      )
    })
}

AddTokenScreen.prototype.render = function () {
  const { isCollapsed } = this.state
  const { goHome } = this.props

  return (
    h('div.add-token', [
      h('div.add-token__wrapper', [
        h('div.add-token__title-container', [
          h('div.add-token__title', 'Add Token'),
          h('div.add-token__description', 'Keep track of the tokens you’ve bought with your MetaMask account. If you bought tokens using a different account, those tokens will not appear here.'),
          h('div.add-token__description', 'Search for tokens or select from our list of popular tokens.'),
        ]),
        h('div.add-token__content-container', [
          h('div.add-token__input-container', [
            h('input.add-token__input', {
              type: 'text',
              placeholder: 'Search',
              onChange: e => this.setState({ searchQuery: e.target.value }),
            }),
          ]),
          h(
            'div.add-token__token-icons-container',
            this.renderTokenList(),
          ),
        ]),
        h('div.add-token__footers', [
          h('div.add-token__add-custom', {
            onClick: () => this.setState({ isCollapsed: !isCollapsed }),
          }, 'Add custom token'),
          this.renderCustomForm(),
        ]),
      ]),
      h('div.add-token__buttons', [
        h('button.btn-secondary', 'Next'),
        h('button.btn-tertiary', {
          onClick: goHome,
        }, 'Cancel'),
      ]),
    ])
  )
}

// AddTokenScreen.prototype.render = function () {
//   const state = this.state
//   const props = this.props
//   const { warning, symbol, decimals } = state

//   return (
//     h('.flex-column.flex-grow', [

//       // subtitle and nav
//       h('.section-title.flex-row.flex-center', [
//         h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
//           onClick: (event) => {
//             props.dispatch(actions.goHome())
//           },
//         }),
//         h('h2.page-subtitle', 'Add Token'),
//       ]),

//       h('.error', {
//         style: {
//           display: warning ? 'block' : 'none',
//           padding: '0 20px',
//           textAlign: 'center',
//         },
//       }, warning),

//       // conf view
//       h('.flex-column.flex-justify-center.flex-grow.select-none', [
//         h('.flex-space-around', {
//           style: {
//             padding: '20px',
//           },
//         }, [

//           h('div', [
//             h(Tooltip, {
//               position: 'top',
//               title: 'The contract of the actual token contract. Click for more info.',
//             }, [
//               h('a', {
//                 style: { fontWeight: 'bold', paddingRight: '10px'},
//                 href: 'https://consensyssupport.happyfox.com/staff/kb/article/24-what-is-a-token-contract-address',
//                 target: '_blank',
//               }, [
//                 h('span', 'Token Contract Address  '),
//                 h('i.fa.fa-question-circle'),
//               ]),
//             ]),
//           ]),

//           h('section.flex-row.flex-center', [
//             h('input#token-address', {
//               name: 'address',
//               placeholder: 'Token Contract Address',
//               onChange: this.tokenAddressDidChange.bind(this),
//               style: {
//                 width: 'inherit',
//                 flex: '1 0 auto',
//                 height: '30px',
//                 margin: '8px',
//               },
//             }),
//           ]),

//           h('div', [
//             h('span', {
//               style: { fontWeight: 'bold', paddingRight: '10px'},
//             }, 'Token Symbol'),
//           ]),

//           h('div', { style: {display: 'flex'} }, [
//             h('input#token_symbol', {
//               placeholder: `Like "ETH"`,
//               value: symbol,
//               style: {
//                 width: 'inherit',
//                 flex: '1 0 auto',
//                 height: '30px',
//                 margin: '8px',
//               },
//               onChange: (event) => {
//                 var element = event.target
//                 var symbol = element.value
//                 this.setState({ symbol })
//               },
//             }),
//           ]),

//           h('div', [
//             h('span', {
//               style: { fontWeight: 'bold', paddingRight: '10px'},
//             }, 'Decimals of Precision'),
//           ]),

//           h('div', { style: {display: 'flex'} }, [
//             h('input#token_decimals', {
//               value: decimals,
//               type: 'number',
//               min: 0,
//               max: 36,
//               style: {
//                 width: 'inherit',
//                 flex: '1 0 auto',
//                 height: '30px',
//                 margin: '8px',
//               },
//               onChange: (event) => {
//                 var element = event.target
//                 var decimals = element.value.trim()
//                 this.setState({ decimals })
//               },
//             }),
//           ]),

//           h('button', {
//             style: {
//               alignSelf: 'center',
//             },
//             onClick: (event) => {
//               const valid = this.validateInputs()
//               if (!valid) return

//               const { address, symbol, decimals } = this.state
//               this.props.dispatch(actions.addToken(address.trim(), symbol.trim(), decimals))
//             },
//           }, 'Add'),
//         ]),
//       ]),
//     ])
//   )
// }

AddTokenScreen.prototype.componentWillMount = function () {
  if (typeof global.ethereumProvider === 'undefined') return

  this.eth = new Eth(global.ethereumProvider)
  this.contract = new EthContract(this.eth)
  this.TokenContract = this.contract(abi)
}

AddTokenScreen.prototype.tokenAddressDidChange = function (e) {
  const customAddress = e.target.value.trim()
  this.setState({ customAddress })
  if (ethUtil.isValidAddress(customAddress) && customAddress !== emptyAddr) {
    this.attemptToAutoFillTokenParams(customAddress)
  } else {
    this.setState({
      customSymbol: '',
      customDecimals: 0,
    })
  }
}

AddTokenScreen.prototype.validateInputs = function () {
  let msg = ''
  const state = this.state
  const identitiesList = Object.keys(this.props.identities)
  const { address, symbol, decimals } = state
  const standardAddress = ethUtil.addHexPrefix(address).toLowerCase()

  const validAddress = ethUtil.isValidAddress(address)
  if (!validAddress) {
    msg += 'Address is invalid. '
  }

  const validDecimals = decimals >= 0 && decimals < 36
  if (!validDecimals) {
    msg += 'Decimals must be at least 0, and not over 36. '
  }

  const symbolLen = symbol.trim().length
  const validSymbol = symbolLen > 0 && symbolLen < 10
  if (!validSymbol) {
    msg += 'Symbol must be between 0 and 10 characters.'
  }

  const ownAddress = identitiesList.includes(standardAddress)
  if (ownAddress) {
    msg = 'Personal address detected. Input the token contract address.'
  }

  const isValid = validAddress && validDecimals && !ownAddress

  if (!isValid) {
    this.setState({
      warning: msg,
    })
  } else {
    this.setState({ warning: null })
  }

  return isValid
}

AddTokenScreen.prototype.attemptToAutoFillTokenParams = async function (address) {
  const contract = this.TokenContract.at(address)

  const results = await Promise.all([
    contract.symbol(),
    contract.decimals(),
  ])

  const [ symbol, decimals ] = results
  if (symbol && decimals) {
    this.setState({
      customSymbol: symbol[0],
      customDecimals: decimals[0].toString(),
    })
  }
}
