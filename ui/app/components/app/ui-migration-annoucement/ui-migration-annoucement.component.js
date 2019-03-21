import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'

export default class UiMigrationAnnouncement extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  }

  static defaultProps = {
    shouldShowAnnouncement: true,
  };

  static propTypes = {
    onClose: PropTypes.func.isRequired,
    shouldShowAnnouncement: PropTypes.bool,
  }

  render () {
    const { t } = this.context
    const { onClose, shouldShowAnnouncement } = this.props

    if (!shouldShowAnnouncement) {
      return null
    }

    return (
      <div className="ui-migration-announcement">
        <p>{t('uiMigrationAnnouncement')}</p>
        <p onClick={onClose}>{t('close')}</p>
      </div>
    )
  }
}
