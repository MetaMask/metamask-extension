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
      padding: '30px',
      paddingTop: '0px',
      minHeight: '215px',
      overflowY: 'auto',
    },
  }, [
    h('.flex-row', {
      style: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '20px',
      },
    }, [
      h('img', {
        src: coinOptions[coin].image,
        width: '36px',
        height: '36px',
        style: {
          marginRight: '5px',
        },
      }),

      h('.input-container', { style: {
        position: 'relative',
        marginRight: '30px',
      }}, [
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
            color: '#6729a8',
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
        //     color: '#6729a8',
        //   },
        //   onClick: this.updateCoin.bind(this),
        // }),
        h('i.arrow-right.cursor-pointer', {
          onClick: this.updateCoin.bind(this),
          style: {marginRight: '30px'},
        }),
      ]),

      h('#toCoin.ex-coins', marketinfo.pair.split('_')[1].toUpperCase()),

      h('img', {
        src: coinOptions[marketinfo.pair.split('_')[1].toUpperCase()].image,
        width: '36px',
        height: '36px',
        style: {
          marginLeft: '5px',
        },
      }),
    ]),

    h('.flex-column', {
      style: {
        alignItems: 'flex-start',
      },
    }, [
      this.props.warning ?
        this.props.warning &&
        h('span.error.flex-center', this.props.warning + '')
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

    h('div', {
      style: {
        marginTop: '10px',
      },
    }, `${coin} Address:`),

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
        color: '#6729a8',
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
          marginTop: '20px',
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
    'apiKey': '5efdee9e7d3c99e7c7e8a0f788d6e52205bf00a0e24575fe59df86421f63c477d018840c94f6596cf8946990216073c68144394c384b0ddcbe782351d80d61d7',
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
    h('h3.flex-row', {
      style: {
        color: '#333333',
        paddingBottom: '20px',
        justifyContent: 'space-around',
        textAlign: 'center',
        fontSize: '16px',
        fontFamily: 'Nunito SemiBold',
      },
    }, `Market Info for ${marketinfo.pair.replace('_', ' to ')}:`),
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
