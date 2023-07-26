import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { SECOND } from '../../../shared/constants/time';
import { I18nContext } from '../../contexts/i18n';
import IconDesktopPairing from '../../components/ui/icon/icon-desktop-pairing';
import {
  TEXT_ALIGN,
  TextVariant,
  DISPLAY,
  AlignItems,
  JustifyContent,
  BackgroundColor,
  BorderRadius,
} from '../../helpers/constants/design-system';
import Box from '../../components/ui/box/box';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import Tooltip from '../../components/ui/tooltip';
import { Button, Text } from '../../components/component-library';

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
      <Box
        display={DISPLAY.FLEX}
        justifyContent={JustifyContent.center}
        marginTop={8}
        marginBottom={8}
      >
        <IconDesktopPairing className="desktop-pairing__icon" size={64} />
      </Box>
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
      <>
        <Text variant={TextVariant.headingMd} align={TEXT_ALIGN.CENTER}>
          {t('desktopPageTitle')}
        </Text>
        <Text marginTop={2} align={TEXT_ALIGN.CENTER}>
          {t('desktopPageSubTitle')}
        </Text>
        <Box
          marginBottom={6}
          marginTop={6}
          className="desktop-pairing__clickable"
          onClick={() => {
            handleCopy(otp);
          }}
          data-testid="desktop-pairing-otp-content"
        >
          <Tooltip
            wrapperClassName="desktop-pairing__tooltip-wrapper"
            position="top"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
          >
            <Text
              align={TEXT_ALIGN.CENTER}
              variant={TextVariant.displayMd}
              className="desktop-pairing__otp"
            >
              {otp}
            </Text>
          </Tooltip>
          <Box
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            marginTop={4}
            marginBottom={6}
          >
            <Text
              className="desktop-pairing__countdown-timer"
              variant={TextVariant.paragraph}
              align={TEXT_ALIGN.CENTER}
              backgroundColor={BackgroundColor.backgroundDefault}
              borderRadius={BorderRadius.XL}
              padding={2}
            >
              {t('desktopPairingExpireMessage', [
                <span
                  className="desktop-pairing__countdown-timer-seconds"
                  key={1}
                >
                  {getExpireDuration()}
                </span>,
              ])}
            </Text>
          </Box>
          <Text align={TEXT_ALIGN.CENTER} variant={TextVariant.bodySm}>
            {t('desktopPageDescription')}
          </Text>
        </Box>
      </>
    );
  };

  const renderFooter = () => {
    return (
      <Box>
        <Button
          onClick={() => {
            goBack();
          }}
        >
          {t('done')}
        </Button>
      </Box>
    );
  };

  return (
    <Box
      display={DISPLAY.FLEX}
      flexDirection="column"
      alignItems={AlignItems.center}
      marginLeft={2}
      marginRight={2}
    >
      {renderIcon()}
      {renderContent()}
      {renderFooter()}
    </Box>
  );
}

DesktopPairingPage.propTypes = {
  mostRecentOverviewPage: PropTypes.string,
  showLoadingIndication: PropTypes.func,
  hideLoadingIndication: PropTypes.func,
  generateDesktopOtp: PropTypes.func,
};
