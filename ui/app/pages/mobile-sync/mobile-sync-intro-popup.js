import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { I18nContext } from '../../contexts/i18n'
import Button from '../../components/ui/button'
import Popover from '../../components/ui/popover'

const MOBILE_HOMEPAGE_URL =
  'https://metamask.io/?_branch_match_id=844633002169985313'

export default function MobileSyncIntroPopup({ onClose }) {
  const t = useContext(I18nContext)

  return (
    <div className="intro-popup">
      <Popover
        className="intro-popup__popover mobile-welcome-popup"
        title={t('mobileWelcomeTitle')}
        subtitle={t('mobileWelcomeText')}
        onClose={() => onClose()}
        footerClassName="intro-popup__footer"
        footer={
          <Button
            type="confirm"
            className="intro-popup__button"
            onClick={() => onClose()}
          >
            {t('close')}
          </Button>
        }
      >
        <div className="intro-popup__content">
          <a href={MOBILE_HOMEPAGE_URL}>
            <img
              src="/images/mobile-qr-code.svg"
              alt={t('mobileWelcomeImageAlt')}
              width="128"
              height="128"
            />
          </a>
        </div>
      </Popover>
    </div>
  )
}

MobileSyncIntroPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
}
