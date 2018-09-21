const inherits = require('util').inherits
const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const vreme = new (require('vreme'))()
const explorerLink = require('etherscan-link').createExplorerLink
const actions = require('../actions')
const addressSummary = require('../util').addressSummary

const CopyButton = require('./copyButton')
const EthBalance = require('./eth-balance')
const Tooltip = require('./tooltip')


ShiftListItem.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps)(ShiftListItem)


function mapStateToProps (state) {
  return {
    selectedAddress: state.metamask.selectedAddress,
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
  }
}

inherits(ShiftListItem, Component)

function ShiftListItem () {
  Component.call(this)
}

ShiftListItem.prototype.render = function () {
  return h('div.transaction-list-item.tx-list-clickable', {
    style: {
      paddingTop: '20px',
      paddingBottom: '20px',
      justifyContent: 'space-around',
      alignItems: 'center',
      flexDirection: 'row',
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
        src: 'https://info.shapeshift.io/sites/default/files/logo.png',
        style: {
          height: '35px',
          width: '132px',
          position: 'absolute',
          clip: 'rect(0px,23px,34px,0px)',
        },
      }),
    ]),

    this.renderInfo(),
    this.renderUtilComponents(),
  ])
}

function formatDate (date) {
  return vreme.format(new Date(date), 'March 16 2014 14:30')
}

ShiftListItem.prototype.renderUtilComponents = function () {
  var props = this.props
  const { conversionRate, currentCurrency } = props

  switch (props.response.status) {
    case 'no_deposits':
      return h('.flex-row', [
        h(CopyButton, {
          value: this.props.depositAddress,
        }),
        h(Tooltip, {
          title: this.context.t('qrCode'),
        }, [
          h('i.fa.fa-qrcode.pointer.pop-hover', {
            onClick: () => props.dispatch(actions.reshowQrCode(props.depositAddress, props.depositType)),
            style: {
              margin: '5px',
              marginLeft: '23px',
              marginRight: '12px',
              fontSize: '20px',
              color: '#F7861C',
            },
          }),
        ]),
      ])
    case 'received':
      return h('.flex-row')

    case 'complete':
      return h('.flex-row', [
        h(CopyButton, {
          value: this.props.response.transaction,
        }),
        h(EthBalance, {
          value: `${props.response.outgoingCoin}`,
          conversionRate,
          currentCurrency,
          width: '55px',
          shorten: true,
          needsParse: false,
          incoming: true,
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
          width: '200px',
          overflow: 'hidden',
        },
      }, [
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#ABA9AA',
            width: '100%',
          },
        }, this.context.t('toETHviaShapeShift', [props.depositType])),
        h('div', this.context.t('noDeposits')),
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#ABA9AA',
            width: '100%',
          },
        }, formatDate(props.time)),
      ])
    case 'received':
      return h('.flex-column', {
        style: {
          width: '200px',
          overflow: 'hidden',
        },
      }, [
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#ABA9AA',
            width: '100%',
          },
        }, this.context.t('toETHviaShapeShift', [props.depositType])),
        h('div', this.context.t('conversionProgress')),
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#ABA9AA',
            width: '100%',
          },
        }, formatDate(props.time)),
      ])
    case 'complete':
      var url = explorerLink(props.response.transaction, parseInt('1'))

      return h('.flex-column.pointer', {
        style: {
          width: '200px',
          overflow: 'hidden',
        },
        onClick: () => global.platform.openWindow({ url }),
      }, [
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#ABA9AA',
            width: '100%',
          },
        }, this.context.t('fromShapeShift')),
        h('div', formatDate(props.time)),
        h('div', {
          style: {
            fontSize: 'x-small',
            color: '#ABA9AA',
            width: '100%',
          },
        }, addressSummary(props.response.transaction)),
      ])

    case 'failed':
      return h('span.error', '(' + this.context.t('failed') + ')')
    default:
      return ''
  }
}
