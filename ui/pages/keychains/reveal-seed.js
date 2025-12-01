import qrCode from 'qrcode-generator';
import React, { useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { getErrorMessage } from '../../../shared/modules/error';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import HoldToRevealModal from '../../components/app/modals/hold-to-reveal-modal/hold-to-reveal-modal';
import {
  BUTTON_SIZES,
  BUTTON_VARIANT,
  BannerAlert,
  Button,
  HelpText,
  HelpTextSeverity,
  Label,
  Text,
  TextField,
  TextFieldSize,
  TextFieldType,
} from '../../components/component-library';
import Box from '../../components/ui/box';
import ExportTextContainer from '../../components/ui/export-text-container';
import { Tab, Tabs } from '../../components/ui/tabs';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  AlignItems,
  BlockSize,
  Display,
  JustifyContent,
  Severity,
  Size,
  TextVariant,
} from '../../helpers/constants/design-system';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../hooks/useI18nContext';
import { requestRevealSeedWords } from '../../store/actions';
import { getHDEntropyIndex } from '../../selectors/selectors';
import { endTrace, trace, TraceName } from '../../../shared/lib/trace';
import { PREVIOUS_ROUTE } from '../../helpers/constants/routes';

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN';
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN';

function RevealSeedPage({ navigate, keyringId }) {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);

  const [screen, setScreen] = useState(PASSWORD_PROMPT_SCREEN);
  const [password, setPassword] = useState('');
  const [seedWords, setSeedWords] = useState(null);
  const [completedLongPress, setCompletedLongPress] = useState(false);
  const [error, setError] = useState(null);
  const [isShowingHoldModal, setIsShowingHoldModal] = useState(false);
  const [srpViewEventTracked, setSrpViewEventTracked] = useState(false);

  const onClickCopy = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.KeyExportCopied,
      properties: {
        key_type: MetaMetricsEventKeyType.Srp,
        copy_method: 'clipboard',
        hd_entropy_index: hdEntropyIndex,
      },
    });
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.SrpCopiedToClipboard,
      properties: {
        key_type: MetaMetricsEventKeyType.Srp,
        copy_method: 'clipboard',
        hd_entropy_index: hdEntropyIndex,
      },
    });
  }, [trackEvent, hdEntropyIndex]);

  useEffect(() => {
    const passwordBox = document.getElementById('password-box');
    if (passwordBox) {
      passwordBox.focus();
    }
  }, []);

  const renderQR = () => {
    const qrImage = qrCode(0, 'L');
    qrImage.addData(seedWords);
    qrImage.make();
    return qrImage;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    trace({
      name: TraceName.RevealSeed,
    });
    setSeedWords(null);
    setCompletedLongPress(false);
    setError(null);
    dispatch(requestRevealSeedWords(password, keyringId))
      .then((revealedSeedWords) => {
        trackEvent({
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.KeyExportRevealed,
          properties: {
            key_type: MetaMetricsEventKeyType.Srp,
            hd_entropy_index: hdEntropyIndex,
          },
        });
        setSeedWords(revealedSeedWords);

        setIsShowingHoldModal(true);
      })
      .catch((e) => {
        trackEvent({
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.KeyExportFailed,
          properties: {
            key_type: MetaMetricsEventKeyType.Srp,
            reason: e.message, // 'incorrect_password',
            hd_entropy_index: hdEntropyIndex,
          },
        });
        setError(getErrorMessage(e));
      })
      .finally(() => {
        endTrace({
          name: TraceName.RevealSeed,
        });
      });
  };

  const renderWarning = () => {
    return (
      <BannerAlert severity={Severity.Danger}>
        <Text variant={TextVariant.bodyMd}>
          {t('revealSeedWordsWarning', [
            <Text
              key="reveal-seed-words-warning-2"
              variant={TextVariant.bodyMdBold}
              as="strong"
            >
              {t('revealSeedWordsWarning2')}
            </Text>,
          ])}
        </Text>
      </BannerAlert>
    );
  };

  const renderPasswordPromptContent = () => {
    return (
      <form onSubmit={handleSubmit}>
        <Label htmlFor="password-box">{t('enterPasswordContinue')}</Label>
        <TextField
          inputProps={{
            'data-testid': 'input-password',
          }}
          type={TextFieldType.Password}
          placeholder={t('makeSureNoOneWatching')}
          id="password-box"
          size={TextFieldSize.Large}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={Boolean(error)}
          width={BlockSize.Full}
        />
        {error && (
          <HelpText severity={HelpTextSeverity.Danger}>{error}</HelpText>
        )}
      </form>
    );
  };

  const renderRevealSeedContent = () => {
    // default for SRP_VIEW_SRP_TEXT event because this is the first thing shown after rendering
    if (!srpViewEventTracked) {
      trackEvent({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      setSrpViewEventTracked(true);
    }

    return (
      <div>
        <Tabs
          defaultActiveTabName={t('revealSeedWordsText')}
          onTabClick={(tabName) => {
            if (tabName === 'text-seed') {
              trackEvent({
                category: MetaMetricsEventCategory.Keys,
                event: MetaMetricsEventName.SrpViewSrpText,
                properties: {
                  key_type: MetaMetricsEventKeyType.Srp,
                },
              });
            } else if (tabName === 'qr-srp') {
              trackEvent({
                category: MetaMetricsEventCategory.Keys,
                event: MetaMetricsEventName.SrpViewsSrpQR,
                properties: {
                  key_type: MetaMetricsEventKeyType.Srp,
                },
              });
            }
          }}
        >
          <Tab
            name={t('revealSeedWordsText')}
            tabKey="text-seed"
            className="flex-1"
          >
            <Label marginTop={4}>{t('yourPrivateSeedPhrase')}</Label>
            <ExportTextContainer text={seedWords} onClickCopy={onClickCopy} />
          </Tab>
          <Tab name={t('revealSeedWordsQR')} tabKey="qr-srp" className="flex-1">
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
              paddingTop={4}
              data-testid="qr-srp"
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: renderQR().createTableTag(5, 15),
                }}
              />
            </Box>
          </Tab>
        </Tabs>
      </div>
    );
  };

  const renderPasswordPromptFooter = () => {
    return (
      <Box display={Display.Flex} marginTop="auto" gap={4}>
        <Button
          width={BlockSize.Full}
          size={Size.LG}
          variant={BUTTON_VARIANT.SECONDARY}
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Keys,
              event: MetaMetricsEventName.KeyExportCanceled,
              properties: {
                key_type: MetaMetricsEventKeyType.Srp,
                hd_entropy_index: hdEntropyIndex,
              },
            });
            trackEvent({
              category: MetaMetricsEventCategory.Keys,
              event: MetaMetricsEventName.SrpRevealCancelled,
              properties: {
                key_type: MetaMetricsEventKeyType.Srp,
                hd_entropy_index: hdEntropyIndex,
              },
            });
            navigate(PREVIOUS_ROUTE);
          }}
        >
          {t('cancel')}
        </Button>
        <Button
          width={BlockSize.Full}
          size={Size.LG}
          onClick={(event) => {
            trackEvent({
              category: MetaMetricsEventCategory.Keys,
              event: MetaMetricsEventName.KeyExportRequested,
              properties: {
                key_type: MetaMetricsEventKeyType.Srp,
                hd_entropy_index: hdEntropyIndex,
              },
            });
            trackEvent({
              category: MetaMetricsEventCategory.Keys,
              event: MetaMetricsEventName.SrpRevealNextClicked,
              properties: {
                key_type: MetaMetricsEventKeyType.Srp,
              },
            });
            handleSubmit(event);
          }}
          disabled={password === ''}
        >
          {t('next')}
        </Button>
      </Box>
    );
  };

  const renderRevealSeedFooter = () => {
    return (
      <Box marginTop="auto">
        <Button
          variant={BUTTON_VARIANT.SECONDARY}
          width={BlockSize.Full}
          size={Size.LG}
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Keys,
              event: MetaMetricsEventName.SrpRevealCloseClicked,
              properties: {
                key_type: MetaMetricsEventKeyType.Srp,
              },
            });
            navigate(PREVIOUS_ROUTE);
          }}
        >
          {t('close')}
        </Button>
      </Box>
    );
  };

  const renderContent = () => {
    return screen === PASSWORD_PROMPT_SCREEN || !completedLongPress
      ? renderPasswordPromptContent()
      : renderRevealSeedContent();
  };

  const renderFooter = () => {
    return screen === PASSWORD_PROMPT_SCREEN || !completedLongPress
      ? renderPasswordPromptFooter()
      : renderRevealSeedFooter();
  };

  return (
    <Box
      className="page-container"
      paddingTop={8}
      paddingBottom={8}
      paddingLeft={4}
      paddingRight={4}
      gap={4}
    >
      <Text variant={TextVariant.headingLg}>{t('secretRecoveryPhrase')}</Text>
      <Text variant={TextVariant.bodyMd}>
        {t('revealSeedWordsDescription1', [
          <Button
            key="srp-learn-srp"
            variant={BUTTON_VARIANT.LINK}
            size={BUTTON_SIZES.INHERIT}
            as="a"
            href={ZENDESK_URLS.SECRET_RECOVERY_PHRASE}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('revealSeedWordsSRPName')}
          </Button>,
          <Text
            key="reveal-seed-word-part-3"
            variant={TextVariant.bodyMdBold}
            as="strong"
          >
            {t('revealSeedWordsDescription3')}
          </Text>,
        ])}
      </Text>
      <Text variant={TextVariant.bodyMd}>
        {t('revealSeedWordsDescription2', [
          <Button
            key="srp-learn-more-non-custodial"
            variant={BUTTON_VARIANT.LINK}
            size={BUTTON_SIZES.INHERIT}
            as="a"
            href={ZENDESK_URLS.NON_CUSTODIAL_WALLET}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('revealSeedWordsNonCustodialWallet')}
          </Button>,
        ])}
      </Text>
      {renderWarning()}
      {renderContent()}
      {renderFooter()}
      <HoldToRevealModal
        isOpen={isShowingHoldModal}
        onClose={() => {
          trackEvent({
            category: MetaMetricsEventCategory.Keys,
            event: MetaMetricsEventName.SrpHoldToRevealCloseClicked,
            properties: {
              key_type: MetaMetricsEventKeyType.Srp,
            },
          });
          setIsShowingHoldModal(false);
        }}
        onLongPressed={() => {
          setCompletedLongPress(true);
          setIsShowingHoldModal(false);
          setScreen(REVEAL_SEED_SCREEN);
        }}
        holdToRevealType="SRP"
      />
    </Box>
  );
}

RevealSeedPage.propTypes = {
  navigate: PropTypes.func.isRequired,
  keyringId: PropTypes.string,
};

export default RevealSeedPage;
