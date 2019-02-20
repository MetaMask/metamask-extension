import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../identicon'
import Button from '../../../../button'
import { INITIALIZE_SEED_PHRASE_ROUTE } from '../../../../../routes'

export default class UniqueImageScreen extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    address: PropTypes.string,
    history: PropTypes.object,
  }

  render () {
    const { t } = this.context
    const { address, history } = this.props

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
          onClick={() => history.push(INITIALIZE_SEED_PHRASE_ROUTE)}
        >
          { t('next') }
        </Button>
      </div>
    )
  }
}
