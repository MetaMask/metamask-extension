const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../actions')
const CopyButton = require('./CopyButton')

const isValidAddress = require('../util').isValidAddress
module.exports = connect(mapStateToProps)(ShapeshiftForm)

function mapStateToProps(state) {
  return {
    selectedAccount: state.selectedAccount,
    warning: state.appState.warning,
    isSubLoading: state.appState.isSubLoading,
  }
}

inherits(ShapeshiftForm, Component)

function ShapeshiftForm() {
  Component.call(this)
}

ShapeshiftForm.prototype.render = function () {
  const marketinfo = this.props.accountDetail.formView.marketinfo
  const coinOptions = this.props.accountDetail.formView.coinOptions
  var coin = marketinfo.pair.split('_')[0].toUpperCase()

  return h('.flex-column', {
    style: {
      margin: '10px',
      width: '100%',
      alignItems: 'center',
    },
  }, [
    h('.flex-row', {
      style: {
        justifyContent: 'center',
        alignItems: 'baseline',
      },
    }, [
      h('img', {
        src: coinOptions[coin].image,
        width: '25px',
        height: '25px',
        style: {
          marginRight: '5px',
        },
      }),

      h('.input-container', [
        h('input#fromCoin.buy-inputs.ex-coins', {
          type: 'text',
          list: 'coinList',
          style: {
            boxSizing: 'border-box',
          },
          onChange: this.handleLiveInput.bind(this),
          defaultValue: 'BTC',
        }),

        this.renderCoinList(),

        h('i.fa.fa-pencil-square-o.edit-text', {
          style: {
            fontSize: '12px',
            color: '#F7861C',
            position: 'relative',
            bottom: '23px',
            right: '11px',
          },
        }),
      ]),

      h('.icon-control', [
        h('i.fa.fa-refresh.fa-4.orange', {
          style: {
            position: 'relative',
            bottom: '5px',
            right: '5px',
            color: '#F7861C',
          },
          onClick: this.updateCoin.bind(this),
        }),
        h('i.fa.fa-chevron-right.fa-4.orange', {
          style: {
            position: 'relative',
            bottom: '5px',
            right: '15px',
            color: '#F7861C',
          },
          onClick: this.updateCoin.bind(this),
        }),
      ]),

      h('#toCoin.ex-coins', marketinfo.pair.split('_')[1].toUpperCase()),

      h('img', {
        src: coinOptions[marketinfo.pair.split('_')[1].toUpperCase()].image,
        width: '25px',
        height: '25px',
        style: {
          marginLeft: '5px',
        },
      }),
    ]),

    this.props.isSubLoading ? this.renderLoading() : null,

    h('.flex-column', {
      style: {
        width: '235px',
        alignItems: 'flex-start',
      },
    }, [
      this.props.warning ? this.props.warning && h('span.error.flex-center', {
        style: {
          textAlign: 'center',
          width: '229px',
          height: '82px',
        },
      },
        this.props.warning) : this.renderInfo(),
    ]),

    h(this.activeToggle('.input-container'), {
      style: {
        width: '100%',
        marginTop: '19px',
      },
    }, [
      h('div', 'Receiving address:'),

      h('input.buy-inputs', {
        type: 'text',
        value: this.props.accountDetail.buyAddress,
        onChange: this.handleAddress.bind(this),
        style: {
          boxSizing: 'border-box',
          width: '325px',
          height: '20px',
          padding: ' 5px ',
        },
      }),

      h('i.fa.fa-pencil-square-o.edit-text', {
        style: {
          fontSize: '12px',
          color: '#F7861C',
          position: 'relative',
          bottom: '5px',
          right: '11px',
        },
      }),
    ]),
    h(this.activeToggle('.input-container'), {
      style: {
        width: '100%',
      },
    }, [
      h('div', `${coin} Address:`),

      h('input#fromCoinAddress.buy-inputs', {
        type: 'text',
        placeholder: `Your ${coin} Refund Address`,
        style: {
          boxSizing: 'border-box',
          width: '235px',
          height: '20px',
          padding: ' 5px ',
        },
      }),

      h('i.fa.fa-pencil-square-o.edit-text', {
        style: {
          fontSize: '12px',
          color: '#F7861C',
          position: 'relative',
          bottom: '5px',
          right: '11px',
        },
      }),

      h('button', {
        onClick: this.shift.bind(this),
      },
      'Submit'),
    ]),
  ])
}

ShapeshiftForm.prototype.shift = function () {
  var withdrawal = this.props.accountDetail.buyAddress
  var returnAddress = document.getElementById('fromCoinAddress').value
  var pair = this.props.accountDetail.formView.marketinfo.pair
  var data = {
    'withdrawal': withdrawal,
    'pair': pair,
    'returnAddress': returnAddress,
  }

  if (isValidAddress(withdrawal)) {
    this.props.dispatch(actions.coinShiftRquest(data))
  }
}

ShapeshiftForm.prototype.renderCoinList = function () {
  var list = Object.keys(this.props.accountDetail.formView.coinOptions).map((item) => {
    return h('option', {
      value: item,
    }, item)
  })

  return h('datalist#coinList', {
    onClick: (event) => {
      event.preventDefault()
    },
  }, list)
}

ShapeshiftForm.prototype.updateCoin = function (event) {
  event.preventDefault()
  const props = this.props
  var coinOptions = this.props.accountDetail.formView.coinOptions
  var coin = document.getElementById('fromCoin').value

  if (!coinOptions[coin.toUpperCase()] || coin.toUpperCase() === 'ETH') {
    var message = 'Not a valid coin'
    return props.dispatch(actions.showWarning(message))
  } else {
    return props.dispatch(actions.pairUpdate(coin))
  }
}

ShapeshiftForm.prototype.handleLiveInput = function () {
  const props = this.props
  var coinOptions = this.props.accountDetail.formView.coinOptions
  var coin = document.getElementById('fromCoin').value

  if (!coinOptions[coin.toUpperCase()] || coin.toUpperCase() === 'ETH') {
    return null
  } else {
    return props.dispatch(actions.pairUpdate(coin))
  }
}

ShapeshiftForm.prototype.renderInfo = function () {
  const marketinfo = this.props.accountDetail.formView.marketinfo
  const coinOptions = this.props.accountDetail.formView.coinOptions
  var coin = marketinfo.pair.split('_')[0].toUpperCase()
  const request = this.props.accountDetail.formView.response

  if (!request) {
    return h('span', [
      h('h3.flex-row.text-transform-uppercase', {
        style: {
          color: '#AEAEAE',
          paddingTop: '4px',
          justifyContent: 'space-around',
          textAlign: 'center',
          fontSize: '14px',
        },
      }, `Market Info for ${marketinfo.pair.replace('_', ' to ').toUpperCase()}:`),
      h('.marketinfo', ['Status : ', `${coinOptions[coin].status}`]),
      h('.marketinfo', ['Exchange Rate: ', `${marketinfo.rate}`]),
      h('.marketinfo', ['Limit: ', `${marketinfo.limit}`]),
      h('.marketinfo', ['Minimum : ', `${marketinfo.minimum}`]),
    ])
  } else {
    return h('.flex-column', {
      style: {
        width: '229px',
        height: '82px',
      },
    }, [
      h('.marketinfo', ['Limit: ', `${marketinfo.limit}`]),
      h('.marketinfo', ['Minimum : ', `${marketinfo.minimum}`]),
      h('div', {
        style: {
          fontSize: '12px',
          lineHeight: '16px',
          marginTop: '4px',
          color: '#F7861C',
        },
      }, `Deposit your ${request.depositType} to the address bellow:`),
      h('.flex-row', {
        style: {
          position: 'relative',
          right: '38px',
        },
      }, [
        h('div', {
          style: {
            fontSize: '13px',
          },
        }, request.deposit),
        h(CopyButton, {
          value: request.deposit,
        }),
      ]),
    ])
  }
}

ShapeshiftForm.prototype.handleAddress = function (event) {
  this.props.dispatch(actions.updateBuyAddress(event.target.value))
}

ShapeshiftForm.prototype.activeToggle = function (elementType) {
  if (!this.props.accountDetail.formView.response || this.props.warning) return elementType
  return `${elementType}.inactive`
}

ShapeshiftForm.prototype.renderLoading = function () {
  return h('span', {
    style: {
      position: 'absolute',
      left: '70px',
      bottom: '138px',
      background: 'transparent',
      width: '229px',
      height: '82px',
      display: 'flex',
      justifyContent: 'center',
    },
  }, [
    h('img', {
      style: {
        width: '60px',
      },
      src: 'images/loading.svg',
    }),
  ])
}
