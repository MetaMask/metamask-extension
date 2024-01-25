import qrCode from 'qrcode-generator';
import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
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
import { getMostRecentOverviewPage } from '../../ducks/history/history';
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

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN';
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN';

export default function RevealSeedPage() {
  const history = useHistory();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const [screen, setScreen] = useState(PASSWORD_PROMPT_SCREEN);
  const [password, setPassword] = useState('');
  const [seedWords, setSeedWords] = useState(null);
  const [completedLongPress, setCompletedLongPress] = useState(false);
  const [error, setError] = useState(null);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const [isShowingHoldModal, setIsShowingHoldModal] = useState(false);

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
    setSeedWords(null);
    setCompletedLongPress(false);
    setError(null);
    dispatch(requestRevealSeedWords(password))
      .then((revealedSeedWords) => {
        trackEvent({
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.KeyExportRevealed,
          properties: {
            key_type: MetaMetricsEventKeyType.Srp,
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
          },
        });
        setError(e.message);
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
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.SrpViewSrpText,
      properties: {
        key_type: MetaMetricsEventKeyType.Srp,
      },
    });

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
            className="reveal-seed__tab"
            activeClassName="reveal-seed__active-tab"
            tabKey="text-seed"
          >
            <Label marginTop={4}>{t('yourPrivateSeedPhrase')}</Label>
            <ExportTextContainer
              text={seedWords}
              onClickCopy={() => {
                trackEvent({
                  category: MetaMetricsEventCategory.Keys,
                  event: MetaMetricsEventName.KeyExportCopied,
                  properties: {
                    key_type: MetaMetricsEventKeyType.Srp,
                    copy_method: 'clipboard',
                  },
                });
                trackEvent({
                  category: MetaMetricsEventCategory.Keys,
                  event: MetaMetricsEventName.SrpCopiedToClipboard,
                  properties: {
                    key_type: MetaMetricsEventKeyType.Srp,
                    copy_method: 'clipboard',
                  },
                });
              }}
            />
          </Tab>
          <Tab
            name={t('revealSeedWordsQR')}
            className="reveal-seed__tab"
            activeClassName="reveal-seed__active-tab"
            tabKey="qr-srp"
          >
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
              },
            });
            trackEvent({
              category: MetaMetricsEventCategory.Keys,
              event: MetaMetricsEventName.SrpRevealCancelled,
              properties: {
                key_type: MetaMetricsEventKeyType.Srp,
              },
            });
            history.push(mostRecentOverviewPage);
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
            history.push(mostRecentOverviewPage);
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
