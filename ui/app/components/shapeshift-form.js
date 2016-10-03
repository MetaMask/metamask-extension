const PersistentForm = require('../../lib/persistent-form')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
const actions = require('../actions')
const Qr = require('./qr-code')
const isValidAddress = require('../util').isValidAddress
module.exports = connect(mapStateToProps)(ShapeshiftForm)

function mapStateToProps(state) {
  return {
    selectedAccount: state.selectedAccount,
    warning: state.appState.warning,
    isSubLoading: state.appState.isSubLoading,
    qrRequested: state.appState.qrRequested,
  }
}

inherits(ShapeshiftForm, PersistentForm)

function ShapeshiftForm () {
  PersistentForm.call(this)
  this.persistentFormParentId = 'shapeshift-buy-form'
}

ShapeshiftForm.prototype.render = function () {

  return h(ReactCSSTransitionGroup, {
    className: 'css-transition-group',
    transitionName: 'main',
    transitionEnterTimeout: 300,
    transitionLeaveTimeout: 300,
  }, [
    this.props.qrRequested ? h(Qr, {key: 'qr'}) : this.renderMain(),
  ])

}

ShapeshiftForm.prototype.renderMain = function () {
  const marketinfo = this.props.buyView.formView.marketinfo
  const coinOptions = this.props.buyView.formView.coinOptions
  var coin = marketinfo.pair.split('_')[0].toUpperCase()

  return h('.flex-column', {
    style: {
      // marginTop: '10px',
      padding: '25px',
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
          dataset: {
            persistentFormId: 'input-coin',
          },
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
            bottom: '48px',
            left: '106px',
          },
        }),
      ]),

      h('.icon-control', [
        h('i.fa.fa-refresh.fa-4.orange', {
          style: {
            position: 'relative',
            bottom: '5px',
            left: '5px',
            color: '#F7861C',
          },
          onClick: this.updateCoin.bind(this),
        }),
        h('i.fa.fa-chevron-right.fa-4.orange', {
          style: {
            position: 'relative',
            bottom: '26px',
            left: '10px',
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

    h('.flex-row', {
      style: {
        padding: '10px',
        paddingBottom: '2px',
        width: '100%',
      },
    }, [
      h('div', 'Receiving address:'),
      h('.ellip-address', this.props.buyView.buyAddress),
    ]),

    h(this.activeToggle('.input-container'), {
      style: {
        padding: '10px',
        paddingTop: '0px',
        width: '100%',
      },
    }, [
      h('div', `${coin} Address:`),

      h('input#fromCoinAddress.buy-inputs', {
        type: 'text',
        placeholder: `Your ${coin} Refund Address`,
        dataset: {
          persistentFormId: 'refund-address',
        },
        style: {
          boxSizing: 'border-box',
          width: '278px',
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
      h('.flex-row', {
        style: {
          justifyContent: 'flex-end',
        },
      }, [
        h('button', {
          onClick: this.shift.bind(this),
          style: {
            marginTop: '10px',
          },
        },
        'Submit'),
      ]),
    ]),
  ])
}

ShapeshiftForm.prototype.shift = function () {
  var props = this.props
  var withdrawal = this.props.buyView.buyAddress
  var returnAddress = document.getElementById('fromCoinAddress').value
  var pair = this.props.buyView.formView.marketinfo.pair
  var data = {
    'withdrawal': withdrawal,
    'pair': pair,
    'returnAddress': returnAddress,
    //  Public api key
    'apiKey': '803d1f5df2ed1b1476e4b9e6bcd089e34d8874595dda6a23b67d93c56ea9cc2445e98a6748b219b2b6ad654d9f075f1f1db139abfa93158c04e825db122c14b6',
  }
  var message = [
    `Deposit Limit: ${props.buyView.formView.marketinfo.limit}`,
    `Deposit Minimum:${props.buyView.formView.marketinfo.minimum}`,
  ]
  if (isValidAddress(withdrawal)) {
    this.props.dispatch(actions.coinShiftRquest(data, message))
  }
}

ShapeshiftForm.prototype.renderCoinList = function () {
  var list = Object.keys(this.props.buyView.formView.coinOptions).map((item) => {
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
  var coinOptions = this.props.buyView.formView.coinOptions
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
  var coinOptions = this.props.buyView.formView.coinOptions
  var coin = document.getElementById('fromCoin').value

  if (!coinOptions[coin.toUpperCase()] || coin.toUpperCase() === 'ETH') {
    return null
  } else {
    return props.dispatch(actions.pairUpdate(coin))
  }
}

ShapeshiftForm.prototype.renderInfo = function () {
  const marketinfo = this.props.buyView.formView.marketinfo
  const coinOptions = this.props.buyView.formView.coinOptions
  var coin = marketinfo.pair.split('_')[0].toUpperCase()

  return h('span', {
    style: {
      marginTop: '10px',
      marginBottom: '15px',
    },
  }, [
    h('h3.flex-row.text-transform-uppercase', {
      style: {
        color: '#868686',
        paddingTop: '4px',
        justifyContent: 'space-around',
        textAlign: 'center',
        fontSize: '17px',
      },
    }, `Market Info for ${marketinfo.pair.replace('_', ' to ').toUpperCase()}:`),
    h('.marketinfo', ['Status : ', `${coinOptions[coin].status}`]),
    h('.marketinfo', ['Exchange Rate: ', `${marketinfo.rate}`]),
    h('.marketinfo', ['Limit: ', `${marketinfo.limit}`]),
    h('.marketinfo', ['Minimum : ', `${marketinfo.minimum}`]),
  ])
}

ShapeshiftForm.prototype.handleAddress = function (event) {
  this.props.dispatch(actions.updateBuyAddress(event.target.value))
}

ShapeshiftForm.prototype.activeToggle = function (elementType) {
  if (!this.props.buyView.formView.response || this.props.warning) return elementType
  return `${elementType}.inactive`
}

ShapeshiftForm.prototype.renderLoading = function () {
  return h('span', {
    style: {
      position: 'absolute',
      left: '70px',
      bottom: '194px',
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
