import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import qrCode from 'qrcode-generator'
import { I18nContext } from '../../contexts/i18n'
import Button from '../../components/ui/button'
import Popover from '../../components/ui/popover'

const MOBILE_HOMEPAGE_URL = 'https://metamask.io/download.html'

export default function MobileSyncIntroPopup({ onClose }) {
  const t = useContext(I18nContext)

  const qrImage = qrCode(4, 'M')
  qrImage.addData(MOBILE_HOMEPAGE_URL)
  qrImage.make()

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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            className="qr-code__wrapper"
            dangerouslySetInnerHTML={{
              __html: qrImage.createTableTag(4),
            }}
          />
        </div>
      </Popover>
    </div>
  )
}

MobileSyncIntroPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
}
