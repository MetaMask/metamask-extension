import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../identicon'
import Button from '../../../../button'
import { INITIALIZE_SEED_PHRASE_ROUTE, DEFAULT_ROUTE } from '../../../../../routes'

export default class UniqueImageScreen extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    address: PropTypes.string,
    history: PropTypes.object,
    isImportedKeyring: PropTypes.bool,
    completeOnboarding: PropTypes.func,
  }

  render () {
    const { t } = this.context
    const { address, history, isImportedKeyring, completeOnboarding } = this.props

    return (
      <div>
        <Identicon
          className="first-time-flow__unique-image"
          address={address}
          diameter={70}
        />
        <div className="first-time-flow__header">
          { t('yourUniqueAccountImage') }
        </div>
        <div className="first-time-flow__text-block">
          { t('yourUniqueAccountImageDescription1') }
        </div>
        <div className="first-time-flow__text-block">
          { t('yourUniqueAccountImageDescription2') }
        </div>
        <div className="first-time-flow__text-block">
          { t('yourUniqueAccountImageDescription3') }
        </div>
        <Button
          type="confirm"
          className="first-time-flow__button"
          onClick={async () => {
            if (isImportedKeyring) {
              await completeOnboarding()
              history.push(DEFAULT_ROUTE)
            } else {
              history.push(INITIALIZE_SEED_PHRASE_ROUTE)
            }
          }}
        >
          { t('next') }
        </Button>
      </div>
    )
  }
}
