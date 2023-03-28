import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import { SECOND } from '../../../shared/constants/time';
import Typography from '../../components/ui/typography';
import { I18nContext } from '../../contexts/i18n';
import IconDesktopPairing from '../../components/ui/icon/icon-desktop-pairing';
import {
  TEXT_ALIGN,
  TypographyVariant,
  DISPLAY,
  AlignItems,
  FLEX_DIRECTION,
} from '../../helpers/constants/design-system';
import Box from '../../components/ui/box/box';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import Tooltip from '../../components/ui/tooltip';

export default function DesktopPairingPage({
  generateDesktopOtp,
  mostRecentOverviewPage,
  showLoadingIndication,
  hideLoadingIndication,
}) {
  const t = useContext(I18nContext);
  const history = useHistory();
  const OTP_DURATION = SECOND * 30;
  const REFRESH_INTERVAL = SECOND;
  const time = new Date().getTime();

  const [otp, setOtp] = useState();
  const [lastOtpTime, setLastOtpTime] = useState(time);
  const [currentTime, setCurrentTime] = useState(time);
  const [copied, handleCopy] = useCopyToClipboard();
  const generateIntervalRef = useRef();
  const refreshIntervalRef = useRef();

  const updateCurrentTime = () => {
    setCurrentTime(new Date().getTime());
  };

  const getExpireDuration = () => {
    const timeSinceOtp = currentTime - lastOtpTime;
    const expireDurationMilliseconds = OTP_DURATION - timeSinceOtp;

    const expireDurationSeconds = Math.round(
      expireDurationMilliseconds / SECOND,
    );

    return expireDurationSeconds;
  };

  useEffect(() => {
    const generate = async () => {
      setLastOtpTime(new Date().getTime());
      const OTP = await generateDesktopOtp();
      setOtp(OTP);
    };

    generate();
    updateCurrentTime();

    generateIntervalRef.current = setInterval(() => generate(), OTP_DURATION);
    refreshIntervalRef.current = setInterval(
      () => updateCurrentTime(),
      REFRESH_INTERVAL,
    );

    return function cleanup() {
      clearInterval(generateIntervalRef.current);
      clearInterval(refreshIntervalRef.current);
    };
  }, [OTP_DURATION, REFRESH_INTERVAL, generateDesktopOtp]);

  const renderIcon = () => {
    return (
      <div>
        <Box
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          textAlign={TEXT_ALIGN.CENTER}
          flexDirection={FLEX_DIRECTION.COLUMN}
          marginLeft={6}
          marginRight={6}
          marginTop={12}
        >
          <IconDesktopPairing size={64} />
        </Box>
      </div>
    );
  };

  const goBack = () => {
    history?.push(mostRecentOverviewPage);
  };

  const renderContent = () => {
    if (!otp) {
      showLoadingIndication();
      return null;
    }

    hideLoadingIndication();

    return (
      <div
        className="desktop-pairing__clickable"
        onClick={() => {
          handleCopy(otp);
        }}
        data-testid="desktop-pairing-otp-content"
      >
        <Box
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          textAlign={TEXT_ALIGN.CENTER}
          flexDirection={FLEX_DIRECTION.COLUMN}
          marginLeft={6}
          marginRight={6}
        >
          <Tooltip
            wrapperClassName="desktop-pairing__tooltip-wrapper"
            position="top"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
          >
            <Typography
              align={TEXT_ALIGN.CENTER}
              className="desktop-pairing__otp"
            >
              {otp}
            </Typography>
          </Tooltip>
        </Box>

        <Typography
          variant={TypographyVariant.paragraph}
          align={TEXT_ALIGN.CENTER}
          className="desktop-pairing__countdown-timer"
        >
          {t('desktopPairingExpireMessage', [
            <span className="desktop-pairing__countdown-timer-seconds" key={1}>
              {getExpireDuration()}
            </span>,
          ])}
        </Typography>
        <div className="desktop-pairing__description">
          {t('desktopPageDescription')}
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    return (
      <div className="desktop-pairing__buttons">
        <Button
          type="primary"
          rounded
          onClick={() => {
            goBack();
          }}
        >
          {t('done')}
        </Button>
      </div>
    );
  };

  return (
    <div className="page-container__content">
      <div className="desktop-pairing">
        {renderIcon()}
        <div className="desktop-pairing__title">{t('desktopPageTitle')}</div>
        <div className="desktop-pairing__subtitle">
          {t('desktopPageSubTitle')}
        </div>
      </div>
      <div className="desktop-pairing">{renderContent()}</div>
      {renderFooter()}
    </div>
  );
}

DesktopPairingPage.propTypes = {
  mostRecentOverviewPage: PropTypes.string,
  showLoadingIndication: PropTypes.func,
  hideLoadingIndication: PropTypes.func,
  generateDesktopOtp: PropTypes.func,
};
