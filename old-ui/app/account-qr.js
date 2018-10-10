const PropTypes = require('prop-types')
const {PureComponent} = require('react')
const h = require('react-hyperscript')
const {qrcode: qrCode} = require('qrcode-npm')
const {connect} = require('react-redux')
const {isHexPrefixed} = require('ethereumjs-util')
const actions = require('../../ui/app/actions')
const CopyButton = require('./components/copyButton')

class AccountQrScreen extends PureComponent {
  static defaultProps = {
    warning: null,
  }

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    buyView: PropTypes.any.isRequired,
    Qr: PropTypes.object.isRequired,
    selectedAddress: PropTypes.string.isRequired,
    warning: PropTypes.node,
  }

  render () {
    const {dispatch, Qr, selectedAddress, warning} = this.props
    const address = `${isHexPrefixed(Qr.data) ? 'ethereum:' : ''}${Qr.data}`
    const qrImage = qrCode(4, 'M')

    qrImage.addData(address)
    qrImage.make()

    return h('div.flex-column.full-width', {
      style: {
        alignItems: 'center',
        boxSizing: 'border-box',
        padding: '50px',
      },
    }, [
      h('div.flex-row.full-width', {
        style: {
          alignItems: 'flex-start',
        },
      }, [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer.color-orange', {
          onClick () {
            dispatch(actions.backToAccountDetail(selectedAddress))
          },
        }),
      ]),
      h('div.qr-header', Qr.message),
      warning && h('span.error.flex-center', {
        style: {
          textAlign: 'center',
          width: '229px',
          height: '82px',
        },
      }, [
        this.props.warning,
      ]),
      h('div#qr-container.flex-column', {
        style: {
          marginTop: '25px',
          marginBottom: '15px',
        },
        dangerouslySetInnerHTML: {
          __html: qrImage.createTableTag(4),
        },
      }),
      h('div.flex-row.full-width', [
        h('h3.ellip-address.grow-tenx', Qr.data),
        h(CopyButton, {
          value: Qr.data,
        }),
      ]),
    ])
  }
}

function mapStateToProps (state) {
  return {
    Qr: state.appState.Qr,
    buyView: state.appState.buyView,
    warning: state.appState.warning,
  }
}

module.exports = connect(mapStateToProps)(AccountQrScreen)
