const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const vreme = new (require('vreme'))()
const ethNetProps = require('eth-net-props')
const actions = require('../../../ui/app/actions')
const addressSummary = require('../util').addressSummary

const CopyButton = require('./copy/copy-button')
const EthBalance = require('./eth-balance')
const Tooltip = require('./tooltip')


module.exports = connect(mapStateToProps)(ShiftListItem)

function mapStateToProps (state) {
  return {
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
  }
}

inherits(ShiftListItem, Component)

function ShiftListItem () {
  Component.call(this)
}

ShiftListItem.prototype.render = function () {
  return (
    h('.transaction-list-item.flex-row', {
      style: {
        paddingTop: '20px',
        paddingBottom: '20px',
        justifyContent: 'space-around',
        alignItems: 'center',
      },
    }, [
      h('div', {
        style: {
          width: '0px',
          position: 'relative',
          bottom: '19px',
        },
      }, [
        h('img', {
          src: './images/shapeshift-logo-only.png',
          style: {
            height: '35px',
            position: 'absolute',
            clip: 'rect(0px,23px,34px,0px)',
          },
        }),
      ]),

      this.renderInfo(),
      this.renderUtilComponents(),
    ])
  )
}

function formatDate (date) {
  return vreme.format(new Date(date), 'March 16 2014 14:30')
}

ShiftListItem.prototype.renderUtilComponents = function () {
  var props = this.props
  const { conversionRate, currentCurrency, network } = props

  const valueStyle = {
    fontFamily: 'Nunito Bold',
    width: '100%',
    textAlign: 'right',
    fontSize: '14px',
    color: '#333333',
  }

  const dimStyle = {
    fontFamily: 'Nunito Regular',
    color: '#333333',
    marginLeft: '5px',
    fontSize: '14px',
  }

  switch (props.response.status) {
    case 'no_deposits':
      return h('.flex-row', [
        h(Tooltip, {
          title: 'QR Code',
          id: 'shiftListItem',
        }, [
          h('i.fa.fa-qrcode.pointer.pop-hover', {
            onClick: () => props.dispatch(actions.reshowQrCode(props.depositAddress, props.depositType)),
            style: {
              margin: '5px',
              marginLeft: '23px',
              marginRight: '12px',
              fontSize: '20px',
              color: '#6729a8',
            },
            'data-tip': '',
            'data-for': 'shiftListItem',
          }),
        ]),
      ])
    case 'received':
      return h('.flex-row')

    case 'complete':
      return h('.flex-row', [
        h(EthBalance, {
          valueStyle,
          dimStyle,
          value: `${props.response.outgoingCoin}`,
          conversionRate,
          currentCurrency,
          width: '55px',
          shorten: true,
          needsParse: false,
          incoming: true,
          network,
          style: {
            fontSize: '15px',
            color: '#01888C',
          },
        }),
      ])

    case 'failed':
      return ''
    default:
      return ''
  }
}

ShiftListItem.prototype.renderInfo = function () {
  var props = this.props

  switch (props.response.status) {
    case 'no_deposits':
      return h('.flex-column', {
        style: {
          paddingLeft: '29px',
          textAlign: 'left',
        },
      }, [
        h('div', {
          style: {
            fontSize: 'x-pre-medium',
            color: '#333333',
            width: '100%',
            display: 'inline-flex',
          },
        }, [
          `${props.depositType} to ETH via ShapeShift`,
            h(CopyButton, {
            value: props.depositAddress,
          })]),
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#777777',
            width: '100%',
          },
        }, formatDate(props.time)),
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#777777',
            width: '100%',
          },
        }, 'No deposits received'),
      ])
    case 'received':
      return h('.flex-column', {
        style: {
          overflow: 'hidden',
          paddingLeft: '29px',
          textAlign: 'left',
        },
      }, [
        h('div', {
          style: {
            fontSize: 'x-pre-medium',
            color: '#333333',
            width: '100%',
          },
        }, `${props.depositType} to ETH via ShapeShift`),
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#777777',
            width: '100%',
          },
        }, formatDate(props.time)),
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#777777',
            width: '100%',
          },
        }, 'Conversion in progress'),
      ])
    case 'complete':
      var url = ethNetProps.explorerLinks.getExplorerTxLinkFor(props.response.transaction, parseInt('1'))

      return h('.flex-column.pointer', {
        style: {
          width: '200px',
          overflow: 'hidden',
          paddingLeft: '29px',
          textAlign: 'left',
        },
        onClick: () => global.platform.openWindow({ url }),
      }, [
        h('div', {
          style: {
            fontSize: 'x-pre-medium',
            color: '#333333',
            width: '100%',
            display: 'inline-flex',
          },
        }, [
          addressSummary(props.network, props.response.transaction),
          h(CopyButton, {
            value: this.props.response.transaction,
          }),
        ]),
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#777777',
          },
        }, formatDate(props.time)),
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#777777',
            width: '100%',
          },
        }, 'From ShapeShift'),
      ])

    case 'failed':
      return h('span.error', {
        style: {
          marginLeft: '30px',
        },
      }, '(Failed)')
    default:
      return h('span.error', {
        style: {
          marginLeft: '30px',
        },
      }, 'Transaction was not created')
  }
}
