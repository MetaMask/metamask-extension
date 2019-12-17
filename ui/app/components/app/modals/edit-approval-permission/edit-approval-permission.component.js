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
    origin: PropTypes.string,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    customSpendLimit: this.props.customTokenAmount,
    selectedOptionIsUnlimited: !this.props.customTokenAmount,
  }

  renderModalContent () {
    const { t } = this.context
    const {
      hideModal,
      selectedIdentity,
      tokenAmount,
      tokenSymbol,
      tokenBalance,
      customTokenAmount,
      origin,
    } = this.props
    const { name, address } = selectedIdentity || {}
    const { selectedOptionIsUnlimited } = this.state

    return (
      <div className="edit-approval-permission">
        <div className="edit-approval-permission__header">
          <div className="edit-approval-permission__title">
            { t('editPermission') }
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
            <div>{ t('balance') }</div>
          </div>
          <div className="edit-approval-permission__account-info__balance">
            {`${tokenBalance} ${tokenSymbol}`}
          </div>
        </div>
        <div className="edit-approval-permission__edit-section">
          <div className="edit-approval-permission__edit-section__title">
            { t('spendLimitPermission') }
          </div>
          <div className="edit-approval-permission__edit-section__description">
            { t('allowWithdrawAndSpend', [origin]) }
          </div>
          <div className="edit-approval-permission__edit-section__option">
            <div
              className="edit-approval-permission__edit-section__radio-button"
              onClick={() => this.setState({ selectedOptionIsUnlimited: true })}
            >
              <div
                className={classnames({
                  'edit-approval-permission__edit-section__radio-button-outline': !selectedOptionIsUnlimited,
                  'edit-approval-permission__edit-section__radio-button-outline--selected': selectedOptionIsUnlimited,
                })}
              />
              <div className="edit-approval-permission__edit-section__radio-button-fill" />
              { selectedOptionIsUnlimited && <div className="edit-approval-permission__edit-section__radio-button-dot" />}
            </div>
            <div className="edit-approval-permission__edit-section__option-text">
              <div
                className={classnames({
                  'edit-approval-permission__edit-section__option-label': !selectedOptionIsUnlimited,
                  'edit-approval-permission__edit-section__option-label--selected': selectedOptionIsUnlimited,
                })}
              >
                {
                  tokenAmount < tokenBalance
                    ? t('proposedApprovalLimit')
                    : t('unlimited')
                }
              </div>
              <div className="edit-approval-permission__edit-section__option-description" >
                { t('spendLimitRequestedBy', [origin]) }
              </div>
              <div className="edit-approval-permission__edit-section__option-value" >
                {`${tokenAmount} ${tokenSymbol}`}
              </div>
            </div>
          </div>
          <div className="edit-approval-permission__edit-section__option">
            <div
              className="edit-approval-permission__edit-section__radio-button"
              onClick={() => this.setState({ selectedOptionIsUnlimited: false })}
            >
              <div
                className={classnames({
                  'edit-approval-permission__edit-section__radio-button-outline': selectedOptionIsUnlimited,
                  'edit-approval-permission__edit-section__radio-button-outline--selected': !selectedOptionIsUnlimited,
                })}
              />
              <div className="edit-approval-permission__edit-section__radio-button-fill" />
              { !selectedOptionIsUnlimited && <div className="edit-approval-permission__edit-section__radio-button-dot" />}
            </div>
            <div className="edit-approval-permission__edit-section__option-text">
              <div
                className={classnames({
                  'edit-approval-permission__edit-section__option-label': selectedOptionIsUnlimited,
                  'edit-approval-permission__edit-section__option-label--selected': !selectedOptionIsUnlimited,
                })}
              >
                { t('customSpendLimit') }
              </div>
              <div className="edit-approval-permission__edit-section__option-description" >
                { t('enterMaxSpendLimit') }
              </div>
              <div className="edit-approval-permission__edit-section__option-input" >
                <TextField
                  type="number"
                  min="0"
                  placeholder={ `${customTokenAmount || tokenAmount} ${tokenSymbol}` }
                  onChange={(event) => {
                    this.setState({ customSpendLimit: event.target.value })
                    if (selectedOptionIsUnlimited) {
                      this.setState({ selectedOptionIsUnlimited: false })
                    }
                  }}
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
    const { setCustomAmount, hideModal, customTokenAmount } = this.props
    const { selectedOptionIsUnlimited, customSpendLimit } = this.state
    return (
      <Modal
        onSubmit={() => {
          setCustomAmount(!selectedOptionIsUnlimited ? customSpendLimit : '')
          hideModal()
        }}
        submitText={t('save')}
        submitType="primary"
        contentClass="edit-approval-permission-modal-content"
        containerClass="edit-approval-permission-modal-container"
        submitDisabled={ (customSpendLimit === customTokenAmount) && !selectedOptionIsUnlimited }
      >
        { this.renderModalContent() }
      </Modal>
    )
  }
}
