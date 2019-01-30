import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../identicon'
import Breadcrumbs from '../../../../breadcrumbs'
import Button from '../../../../button'
import { INITIALIZE_NOTICE_ROUTE } from '../../../../../routes'

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
        <Button
          type="first-time"
          className="first-time-flow__button"
          onClick={() => history.push(INITIALIZE_NOTICE_ROUTE)}
        >
          { t('next') }
        </Button>
        <Breadcrumbs
          className="first-time-flow__breadcrumbs"
          total={3}
          currentIndex={0}
        />
      </div>
    )
  }
}
