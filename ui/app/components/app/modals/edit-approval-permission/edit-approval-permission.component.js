import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal from '../../modal'
import Identicon from '../../../ui/identicon'
import TextField from '../../../ui/text-field'
import classnames from 'classnames'

export default class EditApprovalPermission extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    selectedIdentity: PropTypes.object,
    tokenAmount: PropTypes.string,
    customTokenAmount: PropTypes.string,
    tokenSymbol: PropTypes.string,
    tokenBalance: PropTypes.string,
    setCustomAmount: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    customSpendLimit: this.props.customTokenAmount,
    selectedOption: this.props.customTokenAmount ? 'custom' : 'unlimited',
  }

  renderModalContent () {
    const {
      hideModal,
      selectedIdentity,
      tokenAmount,
      tokenSymbol,
      tokenBalance,
      customTokenAmount,
    } = this.props
    const { name, address } = selectedIdentity || {}

    return (
      <div className="edit-approval-permission">
        <div className="edit-approval-permission__header">
          <div className="edit-approval-permission__title">
            Edit Permission
          </div>
          <div
            className="edit-approval-permission__header__close"
            onClick={() => hideModal()}
          />
        </div>
        <div className="edit-approval-permission__account-info">
          <div className="edit-approval-permission__account-info__account">
            <Identicon
              address={address}
              diameter={32}
            />
            <div className="edit-approval-permission__account-info__name">{ name }</div>
            <div>Balance</div>
          </div>
          <div className="edit-approval-permission__account-info__balance">
            {`${tokenBalance} ${tokenSymbol}`}
          </div>
        </div>
        <div className="edit-approval-permission__edit-section">
          <div className="edit-approval-permission__edit-section__title">
            Spend limit permission
          </div>
          <div className="edit-approval-permission__edit-section__description">
            Allow Uniswap to withdraw and spend up to the following amount:
          </div>
          <div className="edit-approval-permission__edit-section__option">
            <div
              className="edit-approval-permission__edit-section__radio-button"
              onClick={() => this.setState({ selectedOption: 'unlimited' })}
            >
              <div className={classnames({
                'edit-approval-permission__edit-section__radio-button-outline': this.state.selectedOption !== 'unlimited',
                'edit-approval-permission__edit-section__radio-button-outline--selected': this.state.selectedOption === 'unlimited',
              })} />
              <div className="edit-approval-permission__edit-section__radio-button-fill" />
              {this.state.selectedOption === 'unlimited' && <div className="edit-approval-permission__edit-section__radio-button-dot" />}
            </div>
            <div className="edit-approval-permission__edit-section__option-text">
              <div className={classnames({
                'edit-approval-permission__edit-section__option-label': this.state.selectedOption !== 'unlimited',
                'edit-approval-permission__edit-section__option-label--selected': this.state.selectedOption === 'unlimited',
              })}>
                {
                  tokenAmount < tokenBalance
                    ? -'Proposed Approval Limit'
                    : 'Unlimited'
                }
              </div>
              <div className="edit-approval-permission__edit-section__option-description" >
                Spend limit requested by Uniswap
              </div>
              <div className="edit-approval-permission__edit-section__option-value" >
                {`${tokenAmount} ${tokenSymbol}`}
              </div>
            </div>
          </div>
          <div className="edit-approval-permission__edit-section__option">
            <div
              className="edit-approval-permission__edit-section__radio-button"
              onClick={() => this.setState({ selectedOption: 'custom' })}
            >
              <div className={classnames({
                'edit-approval-permission__edit-section__radio-button-outline': this.state.selectedOption !== 'custom',
                'edit-approval-permission__edit-section__radio-button-outline--selected': this.state.selectedOption === 'custom',
              })} />
              <div className="edit-approval-permission__edit-section__radio-button-fill" />
              {this.state.selectedOption === 'custom' && <div className="edit-approval-permission__edit-section__radio-button-dot" />}
            </div>
            <div className="edit-approval-permission__edit-section__option-text">
              <div className={classnames({
                'edit-approval-permission__edit-section__option-label': this.state.selectedOption !== 'custom',
                'edit-approval-permission__edit-section__option-label--selected': this.state.selectedOption === 'custom',
              })}>
                Custom spend limit
              </div>
              <div className="edit-approval-permission__edit-section__option-description" >
                Enter a max spend limit
              </div>
              <div className="edit-approval-permission__edit-section__option-input" >
                <TextField
                  type="number"
                  min="0"
                  placeholder={ `${customTokenAmount || tokenAmount} ${tokenSymbol}` }
                  onChange={(event) => this.setState({ customSpendLimit: event.target.value })}
                  fullWidth
                  margin="dense"
                  value={ this.state.customSpendLimit }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const { t } = this.context
    const { setCustomAmount, hideModal } = this.props

    return (
      <Modal
        onSubmit={() => {
          setCustomAmount(Number(this.state.customSpendLimit))
          hideModal()
        }}
        submitText={t('save')}
        submitType="primary"
        contentClass="edit-approval-permission-modal-content"
        containerClass="edit-approval-permission-modal-container"
        submitDisabled={ this.state.customSpendLimit === this.props.customTokenAmount }
      >
        { this.renderModalContent() }
      </Modal>
    )
  }
}
