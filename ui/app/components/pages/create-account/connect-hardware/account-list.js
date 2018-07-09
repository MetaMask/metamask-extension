const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const genAccountLink = require('../../../../../lib/account-link.js')

class AccountList extends Component {
    constructor (props, context) {
        super(props)
    }

    renderAccounts () {
        return h('div.hw-account-list', [
            h('div.hw-account-list__title_wrapper', [
                h('div.hw-account-list__title', {}, [this.context.t('selectAnAddress')]),
                h('div.hw-account-list__device', {}, ['Trezor - ETH']),
            ]),
            this.props.accounts.map((a, i) => {

                return h('div.hw-account-list__item', { key: a.address }, [
                h('span.hw-account-list__item__index', a.index + 1),
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
                    `${a.address.slice(0, 4)}...${a.address.slice(-4)}`
                    ),
                ]),
                h('span.hw-account-list__item__balance', `${a.balance}`),
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
        'button.btn-primary.hw-list-pagination__button',
        {
          onClick: () => this.props.getPage(-1),
        },
        `< ${this.context.t('prev')}`
      ),

      h(
        'button.btn-primary.hw-list-pagination__button',
        {
          onClick: () => this.props.getPage(1),
        },
        `${this.context.t('next')} >`
      ),
    ])
  }

  renderButtons () {
    return h('div.new-account-create-form__buttons', {}, [
      h(
        'button.btn-default.btn--large.new-account-create-form__button',
        {
          onClick: this.props.onCancel.bind(this),
        },
        [this.context.t('cancel')]
      ),

      h(
        `button.btn-primary.btn--large.new-account-create-form__button ${this.props.selectedAccount === null ? '.btn-primary--disabled' : ''}`,
        {
          onClick: this.props.onUnlockAccount.bind(this),
        },
        [this.context.t('unlock')]
      ),
    ])
  }

  render () {
    return h('div', {}, [
        this.renderAccounts(),
        this.renderPagination(),
        this.renderButtons(),
    ])
  }

}


AccountList.propTypes = {
    accounts: PropTypes.array.isRequired,
    onAccountChange: PropTypes.func.isRequired,
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
