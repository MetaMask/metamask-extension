const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
import PropTypes from 'prop-types'
const actions = require('../../ui/app/actions')
const LoadingIndicator = require('./components/loading')
const Web3 = require('web3')
const infuraCurrencies = require('./infura-conversion.json').objects.sort((a, b) => {
      return a.quote.name.toLocaleLowerCase().localeCompare(b.quote.name.toLocaleLowerCase())
    })
const validUrl = require('valid-url')
const exportAsFile = require('./util').exportAsFile
const Modal = require('../../ui/app/components/modals/index').Modal
const ethNetProps = require('eth-net-props')
const { networks } = require('../../app/scripts/controllers/network/util')
const {
  ROPSTEN,
  RINKEBY,
  KOVAN,
  MAINNET,
  POA,
  DAI,
  POA_SOKOL,
  GOERLI_TESTNET,
} = require('../../app/scripts/controllers/network/enums')
const POCKET_PROVIDER_TYPES = [ROPSTEN, RINKEBY, KOVAN, MAINNET, POA, DAI, GOERLI_TESTNET, POA_SOKOL]

class ConfigScreen extends Component {
  static propTypes = {
    metamask: PropTypes.object,
    warning: PropTypes.string,
    provider: PropTypes.object,
    dProviderStore: PropTypes.object,
    setProviderType: PropTypes.func,
    showDeleteRPC: PropTypes.func,
    displayWarning: PropTypes.func,
    goHome: PropTypes.func,
    setDProvider: PropTypes.func,
    setRpcTarget: PropTypes.func,
    confirmChangePassword: PropTypes.func,
    revealSeedConfirmation: PropTypes.func,
    resetAccount: PropTypes.func,
    setCurrentCurrency: PropTypes.func,
  }

  constructor (props) {
    super(props)
    this.state = {
      loading: false,
      dProvider: props.dProviderStore.dProvider,
    }
  }

  render () {
    const props = this.props
    const metamaskState = props.metamask
    const warning = props.warning

    if (props.dProviderStore.dProvider !== this.state.dProvider) {
      this.setState({
        dProvider: props.dProviderStore.dProvider,
      })
    }

    return (
      h('.flex-column.flex-grow', {
        style: {
          maxHeight: '585px',
          overflowY: 'auto',
        },
      }, [

        h(LoadingIndicator, {
          isLoading: this.state.loading,
        }),

        h(Modal, {}, []),

        // subtitle and nav
        h('.section-title.flex-row.flex-center', [
          h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
            onClick: () => {
              props.goHome()
            },
            style: {
              position: 'absolute',
              left: '30px',
            },
          }),
          h('h2', 'Settings'),
        ]),

        h('div', {
          style: {
            margin: '0 30px',
          },
        }, [
          h('.error', {
            style: {
              display: warning ? 'block' : 'none',
            },
          }, warning),
        ]),

        // conf view
        h('.flex-column.flex-justify-center.flex-grow.select-none', [
          h('.flex-space-around', {
            style: {
              padding: '30px',
              overflow: 'auto',
            },
          }, [

            this.currentProviderDisplay(metamaskState),

            h('div', { style: {display: 'flex'} }, [
              h('input#new_rpc', {
                placeholder: 'New RPC URL',
                style: {
                  width: 'inherit',
                  flex: '1 0 auto',
                  height: '32px',
                  borderRadius: '3px',
                  border: '1px solid #e2e2e2',
                  padding: '10px',
                  marginBottom: '20px',
                },
                onKeyPress: (event) => {
                  if (event.key === 'Enter') {
                    const element = event.target
                    const newRpc = element.value
                    this.rpcValidation(newRpc)
                  }
                },
              }),
            ]),

            h('button.btn-spread', {
              onClick: (event) => {
                event.preventDefault()
                const element = document.querySelector('input#new_rpc')
                const newRpc = element.value
                this.rpcValidation(newRpc)
              },
            }, 'Save'),

            h('hr.horizontal-line'),

            this.currentConversionInformation(metamaskState),

            h('hr.horizontal-line'),

            h('div', [
              h('p.config-title', `State logs`),
              h('p.config-description', `State logs contain your public account addresses and sent transactions.`),
              h('button.btn-spread', {
                style: {
                  alignSelf: 'center',
                },
                onClick (event) {
                  window.logStateString((err, result) => {
                    if (err) {
                      props.displayWarning('Error in retrieving state logs.')
                    } else {
                      exportAsFile('Nifty Wallet State Logs.json', result)
                    }
                  })
                },
              }, 'Download State Logs'),
            ]),

            h('hr.horizontal-line'),

            h('div', [
              h('p.config-title', `Seed words`),
              h('p.config-description', `Reveal seed words.`),
              h('button.btn-spread', {
                style: {
                  alignSelf: 'center',
                },
                onClick (event) {
                  event.preventDefault()
                  props.revealSeedConfirmation()
                },
              }, 'Reveal Seed Words'),
            ]),

            h('hr.horizontal-line', {
              style: {
                marginTop: '20px',
              },
            }),

            h('p.config-title', `Provider`),

            h('div', {
              style: {
                display: 'table',
                width: '100%',
              },
            }, [
              h('div', {
                style: {
                display: 'table-cell',
              }}, [
                h('p.config-description', 'Switch to Decentralized Provider (Pocket)'),
              ]),
              h('div', { style: {
                display: 'table-cell',
              }}, [
                h('input', {
                  type: 'checkbox',
                  name: 'pocket-checkbox',
                  checked: this.state.dProvider,
                  onChange: (event) => {
                    event.preventDefault()
                    this.toggleProvider()
                  },
                }),
              ]),
            ]),

            h('hr.horizontal-line'),

            h('div', [
              h('p.config-title', `Account`),
              h('p.config-description', `Resetting is for developer use only.`),
              h('button.btn-spread', {
                style: {
                  alignSelf: 'center',
                },
                onClick (event) {
                  event.preventDefault()
                  props.resetAccount()
                },
              }, 'Reset Account'),

              h('p.config-description', 'Changing of password'),

              h('button.btn-spread', {
                onClick (event) {
                  event.preventDefault()
                  props.confirmChangePassword()
                },
              }, 'Change password'),
            ]),
          ]),
        ]),
      ])
    )
  }

  toggleProvider () {
    const props = this.props
    const isPocket = POCKET_PROVIDER_TYPES.includes(props.provider.type)
    if (isPocket) {
      if (!this.state.dProvider) {
        props.setDProvider(true)
        this.setState({
          dProvider: true,
        })
      } else {
        props.setDProvider(false)
        this.setState({
          dProvider: false,
        })
      }
      props.setProviderType(props.provider.type)
    } else {
      alert('Pocket does not support this network, using centralized provider')
    }
  }

  componentWillUnmount () {
    this.props.displayWarning('')
  }

  rpcValidation (newRpc) {
    const props = this.props
    if (validUrl.isWebUri(newRpc)) {
      this.setState({
        loading: true,
      })
      const web3 = new Web3(new Web3.providers.HttpProvider(newRpc))
      web3.eth.getBlockNumber((err, res) => {
        if (err) {
          props.displayWarning('Invalid RPC endpoint')
        } else {
          props.setRpcTarget(newRpc)
        }
        this.setState({
          loading: false,
        })
      })
    } else {
      if (!newRpc.startsWith('http')) {
        props.displayWarning('URIs require the appropriate HTTP/HTTPS prefix.')
      } else {
        props.displayWarning('Invalid RPC URI')
      }
    }
  }

  currentConversionInformation (metamaskState) {
    const props = this.props
    const currentCurrency = metamaskState.currentCurrency
    const conversionDate = metamaskState.conversionDate
    return h('div', [
      h('div.config-title', 'Current Conversion'),
      h('div.config-description', `Updated ${Date(conversionDate)}`),
      h('select.config-select-currency#currentCurrency', {
        onChange (event) {
          event.preventDefault()
          const element = document.getElementById('currentCurrency')
          const newCurrency = element.value
          props.setCurrentCurrency(newCurrency)
        },
        defaultValue: currentCurrency,
      }, infuraCurrencies.map((currency) => {
        return h('option', {key: currency.quote.code, value: currency.quote.code}, `${currency.quote.code.toUpperCase()} - ${currency.quote.name}`)
      }),
    ),
    ])
  }

  currentProviderDisplay (metamaskState) {
    const props = this.props
    const provider = metamaskState.provider
    let title, value

    if (networks[provider.type]) {
      title = 'Current Network'
      value = ethNetProps.props.getNetworkDisplayName(networks[provider.type].networkID)
    } else {
      title = 'Current RPC'
      value = metamaskState.provider.rpcTarget
    }

    return h('div', [
      h('div.config-title', title),
      h('div.config-description', value),
      provider.type === 'rpc' && h('button.btn-spread', {
        onClick (event) {
          event.preventDefault()
          props.showDeleteRPC()
        },
      }, 'Delete'),
    ])
  }
}

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    provider: state.metamask.provider,
    dProviderStore: state.metamask.dProviderStore,
    warning: state.appState.warning,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setProviderType: (providerType) => dispatch(actions.setProviderType(providerType)),
    showDeleteRPC: (label, transitionForward) => dispatch(actions.showDeleteRPC(label, transitionForward)),
    displayWarning: (msg) => dispatch(actions.displayWarning(msg)),
    goHome: () => dispatch(actions.goHome()),
    setDProvider: (set) => dispatch(actions.setDProvider(set)),
    setRpcTarget: (rpcTarget) => dispatch(actions.setRpcTarget(rpcTarget)),
    setCurrentCurrency: (newCurrency) => dispatch(actions.setRpcTarget(newCurrency)),
    confirmChangePassword: () => dispatch(actions.confirmChangePassword()),
    resetAccount: () => dispatch(actions.resetAccount()),
    revealSeedConfirmation: () => dispatch(actions.revealSeedConfirmation()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ConfigScreen)
