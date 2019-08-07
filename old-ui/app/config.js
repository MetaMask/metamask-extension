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

  constructor (props) {
    super(props)
    this.state = {
      loading: false,
      dProvider: props.metamask.dProviderStore.dProvider
    }
  }

  static propTypes = {
    dispatch: PropTypes.func,
  }

  render () {
    const state = this.props
    const metamaskState = state.metamask
    const warning = state.warning

    if(state.metamask.dProviderStore.dProvider != this.state.dProvider){
      this.setState({
        dProvider: this.props.metamask.dProviderStore.dProvider
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
              state.dispatch(actions.goHome())
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

            this.currentProviderDisplay(metamaskState, state),

            h('div', { style: {display: 'flex'} }, [
              h('input#new_rpc', {
                placeholder: 'New RPC URL',
                style: {
                  width: 'inherit',
                  flex: '1 0 auto',
                  height: '32px',
                  margin: '20px 20px 0 0',
                  borderRadius: '3px',
                  border: '1px solid #e2e2e2',
                  padding: '10px',
                },
                onKeyPress: (event) => {
                  if (event.key === 'Enter') {
                    const element = event.target
                    const newRpc = element.value
                    this.rpcValidation(newRpc, state)
                  }
                },
              }),
              h('button', {
                style: {
                  alignSelf: 'center',
                  marginTop: '20px',
                },
                onClick: (event) => {
                  event.preventDefault()
                  const element = document.querySelector('input#new_rpc')
                  const newRpc = element.value
                  this.rpcValidation(newRpc, state)
                },
              }, 'Save'),
            ]),

            h('hr.horizontal-line'),

            this.currentConversionInformation(metamaskState, state),

            h('hr.horizontal-line', {
              style: {
                marginTop: '20px',
              },
            }),

            h('div', {
              style: {
                marginTop: '20px',
              },
            }, [
              h('p', {
                style: {
                  fontFamily: 'Nunito Regular',
                  fontSize: '14px',
                  lineHeight: '18px',
                },
              }, `State logs contain your public account addresses and sent transactions.`),
              h('br'),
              h('button', {
                style: {
                  alignSelf: 'center',
                },
                onClick (event) {
                  window.logStateString((err, result) => {
                    if (err) {
                      state.dispatch(actions.displayWarning('Error in retrieving state logs.'))
                    } else {
                      exportAsFile('Nifty Wallet State Logs.json', result)
                    }
                  })
                },
              }, 'Download State Logs'),
            ]),

            h('hr.horizontal-line', {
              style: {
                marginTop: '20px',
              },
            }),

            h('div', {
              style: {
                marginTop: '20px',
              },
            }, [
              h('button', {
                style: {
                  alignSelf: 'center',
                },
                onClick (event) {
                  event.preventDefault()
                  state.dispatch(actions.revealSeedConfirmation())
                },
              }, 'Reveal Seed Words'),
            ]),

            h('hr.horizontal-line', {
              style: {
                marginTop: '20px',
              },
            }),

            h('p', {
              style: {
                fontFamily: 'Nunito Regular',
                fontSize: '14px',
                lineHeight: '18px',
              },
            }, [
              'Switch to Decentralized Provider (Pocket)',
            ]),

            h('input', {
              type:'checkbox',
              name:'pocket-checkbox',
              checked: this.state.dProvider,
              onChange: (event) => {
                event.preventDefault()
                this.toggleProvider()
              },
            }),

            h('hr.horizontal-line', {
              style: {
                marginTop: '20px',
              },
            }),

            h('div', {
              style: {
                marginTop: '20px',
              },
            }, [

              h('p', {
                style: {
                  fontFamily: 'Nunito Regular',
                  fontSize: '14px',
                  lineHeight: '18px',
                },
              }, [
                'Resetting is for developer use only. ',
              ]),
              h('br'),

              h('button', {
                style: {
                  alignSelf: 'center',
                },
                onClick (event) {
                  event.preventDefault()
                  state.dispatch(actions.resetAccount())
                },
              }, 'Reset Account'),

              h('hr.horizontal-line', {
                style: {
                  marginTop: '20px',
                },
              }),

              h('button', {
                style: {
                  alignSelf: 'center',
                },
                onClick (event) {
                  event.preventDefault()
                  state.dispatch(actions.confirmChangePassword())
                },
              }, 'Change password'),
            ]),
          ]),
        ]),
      ])
    )
  }

  toggleProvider(){
    const isPocket = POCKET_PROVIDER_TYPES.includes(this.props.metamask.provider.type)
    if (isPocket){
      if (!this.state.dProvider){
        this.props.dispatch(actions.setDProvider(true))
        this.setState({
          dProvider: true
        })
      } else {
        this.props.dispatch(actions.setDProvider(false))
        this.setState({
          dProvider: false
        })
      }
      this.props.dispatch(actions.setProviderType(this.props.metamask.provider.type))
    } else {
      alert("Pocket does not support this network, using centralized provider")
    }
  }

  componentWillUnmount () {
    this.props.dispatch(actions.displayWarning(''))
  }

  rpcValidation (newRpc, state) {
    if (validUrl.isWebUri(newRpc)) {
      this.setState({
        loading: true,
      })
      const web3 = new Web3(new Web3.providers.HttpProvider(newRpc))
      web3.eth.getBlockNumber((err, res) => {
        if (err) {
          state.dispatch(actions.displayWarning('Invalid RPC endpoint'))
        } else {
          state.dispatch(actions.setRpcTarget(newRpc))
        }
        this.setState({
          loading: false,
        })
      })
    } else {
      if (!newRpc.startsWith('http')) {
        state.dispatch(actions.displayWarning('URIs require the appropriate HTTP/HTTPS prefix.'))
      } else {
        state.dispatch(actions.displayWarning('Invalid RPC URI'))
      }
    }
  }

  currentConversionInformation (metamaskState, state) {
    const currentCurrency = metamaskState.currentCurrency
    const conversionDate = metamaskState.conversionDate
    return h('div', [
      h('span', {style: { fontWeight: 'bold', paddingRight: '10px'}}, 'Current Conversion'),
      h('span', {style: { fontWeight: 'bold', paddingRight: '10px', fontSize: '13px'}}, `Updated ${Date(conversionDate)}`),
      h('select#currentCurrency', {
        onChange (event) {
          event.preventDefault()
          const element = document.getElementById('currentCurrency')
          const newCurrency = element.value
          state.dispatch(actions.setCurrentCurrency(newCurrency))
        },
        defaultValue: currentCurrency,
      }, infuraCurrencies.map((currency) => {
        return h('option', {key: currency.quote.code, value: currency.quote.code}, `${currency.quote.code.toUpperCase()} - ${currency.quote.name}`)
      })
    ),
    ])
  }

  currentProviderDisplay (metamaskState, state) {
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
      h('span', {style: { fontWeight: 'bold', paddingRight: '10px'}}, title),
      h('span', value),
      provider.type === 'rpc' && h('button', {
        onClick (event) {
          event.preventDefault()
          state.dispatch(actions.showDeleteRPC())
        },
      }, 'Delete'),
    ])
  }
}

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    warning: state.appState.warning,
  }
}

module.exports = connect(mapStateToProps)(ConfigScreen)
