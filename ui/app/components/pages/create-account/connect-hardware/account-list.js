const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const genAccountLink = require('../../../../../lib/account-link.js')
const Select = require('react-select').default

class AccountList extends Component {
    constructor (props, context) {
        super(props)
    }

    getHdPaths () {
      return [
        {
          label: `m/44'/60'/0' (Legacy)`,
          value: `m/44'/60'/0'`,
        },
        {
          label: `m/44'/60'/0'/0`,
          value: `m/44'/60'/0'/0'`,
        },
      ]
    }

    renderHdPathSelector () {
      const { onPathChange, selectedPath } = this.props

      const options = this.getHdPaths()
      return h('div.hw-connect__hdPath', [
        h('h3.hw-connect__hdPath__title', {}, `HD Path`),
        h(Select, {
          className: 'hw-connect__hdPath__select',
          name: 'hd-path-select',
          clearable: false,
          value: selectedPath,
          options,
          onChange: (opt) => {
            onPathChange(opt.value)
          },
        }),
      ])
    }
    renderHeader () {
      const { device } = this.props
      return (
        h('div.hw-connect', [

          h('h3.hw-connect__title', {}, `${device.toUpperCase()} - ${this.context.t('selectAnAccount')}`),

          device.toLowerCase() === 'ledger' ? this.renderHdPathSelector() : null,

          h('p.hw-connect__msg', {}, this.context.t('selectAnAccountHelp')),
        ])
      )
    }

    renderAccounts () {
        return h('div.hw-account-list', [
            this.props.accounts.map((a, i) => {

                return h('div.hw-account-list__item', { key: a.address }, [
                h('div.hw-account-list__item__radio', [
                    h('input', {
                        type: 'radio',
                        name: 'selectedAccount',
                        id: `address-${i}`,
                        value: a.index,
                        onChange: (e) => this.props.onAccountChange(e.target.value),
                        checked: this.props.selectedAccount === a.index.toString(),
                    }),
                    h(
                    'label.hw-account-list__item__label',
                    {
                        htmlFor: `address-${i}`,
                    },
                    [
                      h('span.hw-account-list__item__index', a.index + 1),
                      `${a.address.slice(0, 4)}...${a.address.slice(-4)}`,
                      h('span.hw-account-list__item__balance', `${a.balance}`),
                    ]),
                ]),
                h(
                    'a.hw-account-list__item__link',
                    {
                    href: genAccountLink(a.address, this.props.network),
                    target: '_blank',
                    title: this.context.t('etherscanView'),
                    },
                    h('img', { src: 'images/popout.svg' })
                ),
                ])
            }),
        ])
    }

  renderPagination () {
    return h('div.hw-list-pagination', [
      h(
        'button.hw-list-pagination__button',
        {
          onClick: () => this.props.getPage(-1, this.props.device),
        },
        `< ${this.context.t('prev')}`
      ),

      h(
        'button.hw-list-pagination__button',
        {
          onClick: () => this.props.getPage(1, this.props.device),
        },
        `${this.context.t('next')} >`
      ),
    ])
  }

  renderButtons () {
    const disabled = this.props.selectedAccount === null
    const buttonProps = {}
    if (disabled) {
      buttonProps.disabled = true
    }

    return h('div.new-account-connect-form__buttons', {}, [
      h(
        'button.btn-default.btn--large.new-account-connect-form__button',
        {
          onClick: this.props.onCancel.bind(this),
        },
        [this.context.t('cancel')]
      ),

      h(
        `button.btn-primary.btn--large.new-account-connect-form__button.unlock ${disabled ? '.btn-primary--disabled' : ''}`,
        {
          onClick: this.props.onUnlockAccount.bind(this, this.props.device),
          ...buttonProps,
        },
        [this.context.t('unlock')]
      ),
    ])
  }

  renderForgetDevice () {
    return h('div.hw-forget-device-container', {}, [
      h('a', {
        onClick: this.props.onForgetDevice.bind(this, this.props.device),
      }, this.context.t('forgetDevice')),
    ])
  }

  render () {
    return h('div.new-account-connect-form.account-list', {}, [
        this.renderHeader(),
        this.renderAccounts(),
        this.renderPagination(),
        this.renderButtons(),
        this.renderForgetDevice(),
    ])
  }

}


AccountList.propTypes = {
    onPathChange: PropTypes.func.isRequired,
    selectedPath: PropTypes.string.isRequired,
    device: PropTypes.string.isRequired,
    accounts: PropTypes.array.isRequired,
    onAccountChange: PropTypes.func.isRequired,
    onForgetDevice: PropTypes.func.isRequired,
    getPage: PropTypes.func.isRequired,
    network: PropTypes.string,
    selectedAccount: PropTypes.string,
    history: PropTypes.object,
    onUnlockAccount: PropTypes.func,
    onCancel: PropTypes.func,
}

AccountList.contextTypes = {
    t: PropTypes.func,
}

module.exports = AccountList
