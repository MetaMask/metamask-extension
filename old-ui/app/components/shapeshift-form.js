const PersistentForm = require('../../lib/persistent-form')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../../ui/app/actions')
const isValidAddress = require('../util').isValidAddress
module.exports = connect(mapStateToProps)(ShapeshiftForm)

function mapStateToProps (state) {
  return {
    warning: state.appState.warning,
    isSubLoading: state.appState.isSubLoading,
  }
}

inherits(ShapeshiftForm, PersistentForm)

function ShapeshiftForm () {
  PersistentForm.call(this)
  this.persistentFormParentId = 'shapeshift-buy-form'
}

ShapeshiftForm.prototype.render = function () {
  return this.renderMain()
}

ShapeshiftForm.prototype.renderMain = function () {
  const marketinfo = this.props.buyView.formView.marketinfo
  const coinOptions = this.props.buyView.formView.coinOptions
  var coin = marketinfo.pair.split('_')[0].toUpperCase()

  return h('.flex-column', {
    style: {
      position: 'relative',
      padding: '25px',
      paddingTop: '5px',
      width: '90%',
      minHeight: '215px',
      alignItems: 'center',
      overflowY: 'auto',
    },
  }, [
    h('.flex-row', {
      style: {
        justifyContent: 'center',
        alignItems: 'baseline',
        height: '42px',
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

      h('.input-container', {
        position: 'relative',
      }, [
        h('input#fromCoin.buy-inputs.ex-coins', {
          type: 'text',
          list: 'coinList',
          autoFocus: true,
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
            position: 'absolute',
          },
        }),
      ]),

      h('.icon-control', {
        style: {
          position: 'relative',
        },
      }, [
        // Not visible on the screen, can't see it on master.

        // h('i.fa.fa-refresh.fa-4.orange', {
        //   style: {
        //     bottom: '5px',
        //     left: '5px',
        //     color: '#F7861C',
        //   },
        //   onClick: this.updateCoin.bind(this),
        // }),
        h('i.fa.fa-chevron-right.fa-4.orange', {
          style: {
            position: 'absolute',
            bottom: '35%',
            left: '0%',
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

    h('.flex-column', {
      style: {
        marginTop: '1%',
        alignItems: 'flex-start',
      },
    }, [
      this.props.warning ?
        this.props.warning &&
        h('span.error.flex-center', {
          style: {
            textAlign: 'center',
            width: '229px',
            height: '82px',
          },
        }, this.props.warning + '')
        : this.renderInfo(),

      this.renderRefundAddressForCoin(coin),
    ]),

  ])
}

ShapeshiftForm.prototype.renderRefundAddressForCoin = function (coin) {
  return h(this.activeToggle('.input-container'), {
    style: {
      marginTop: '1%',
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
        width: '227px',
        height: '30px',
        padding: ' 5px ',
      },
    }),

    h('i.fa.fa-pencil-square-o.edit-text', {
      style: {
        fontSize: '12px',
        color: '#F7861C',
        position: 'absolute',
      },
    }),
    h('div.flex-row', {
      style: {
        justifyContent: 'flex-start',
      },
    }, [
      h('button', {
        onClick: this.shift.bind(this),
        style: {
          marginTop: '1%',
        },
      },
      'Submit'),
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
    return props.dispatch(actions.displayWarning(message))
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
