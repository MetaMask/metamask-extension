const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const genAccountLink = require('../../../../lib/account-link.js')
const { DEFAULT_ROUTE } = require('../../../routes')
const { formatBalance } = require('../../../util')

export default class AccountList extends Component {
    constructor (props, context) {
        super(props)
    }

    getBalance (address) {
        // Get the balance
        const { accounts } = this.props
        const balanceValue = accounts && accounts[address] ? accounts[address].balance : ''
        const formattedBalance = balanceValue ? formatBalance(balanceValue, 6) : '...'
        return formattedBalance
    }

    renderAccounts () {
        if (!this.props.accounts.length) {
        return null
        }

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
                }),
                h(
                'label.hw-account-list__item__label',
                {
                    htmlFor: `address-${i}`,
                },
                `${a.address.slice(0, 4)}...${a.address.slice(-4)}`
                ),
            ]),
            h('span.hw-account-list__item__balance', `${this.getBalance(a.address)}`),
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
    if (!this.state.accounts.length) {
      return null
    }
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
    if (!this.state.accounts.length) {
      return null
    }
    const { history } = this.props

    return h('div.new-account-create-form__buttons', {}, [
      h(
        'button.btn-default.btn--large.new-account-create-form__button',
        {
          onClick: () => history.push(DEFAULT_ROUTE),
        },
        [this.context.t('cancel')]
      ),

      h(
        'button.btn-primary.btn--large.new-account-create-form__button',
        {
          onClick: () => {
            this.unlockAccount(this.state.selectedAccount)
              .then(() => history.push(DEFAULT_ROUTE))
              .catch(e => {
                this.setState({ error: e.error })
              })
          },
        },
        [this.context.t('unlock')]
      ),
    ])
  }

  render () {
      return null
  }

}


AccountList.propTypes = {
    accounts: PropTypes.object.isRequired,
    onAccountChange: PropTypes.func.isRequired,
    getPage: PropTypes.func.isRequired,
    network: PropTypes.string,
    history: PropTypes.object,
}

AccountList.contextTypes = {
    t: PropTypes.func,
}
