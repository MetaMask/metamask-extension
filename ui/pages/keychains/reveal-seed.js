import React, { useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import qrCode from 'qrcode-generator';
import { requestRevealSeedWords, showModal } from '../../store/actions';
import ExportTextContainer from '../../components/ui/export-text-container';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';
import { TEXT, COLORS } from '../../helpers/constants/design-system';

import Button from '../../components/ui/button';
import { Text, Label, Icon } from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { Tabs, Tab } from '../../components/ui/tabs';

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN';
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN';

const RevealSeedPage = () => {
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
    try {
      dispatch(requestRevealSeedWords(password)).then((revealedSeedWords) => {
        trackEvent({
          category: EVENT.CATEGORIES.KEYS,
          event: EVENT_NAMES.KEY_EXPORT_REVEALED,
          properties: {
            key_type: EVENT.KEY_TYPES.SRP,
          },
        });
        setSeedWords(revealedSeedWords);
      });
      dispatch(
        showModal({
          name: 'HOLD_TO_REVEAL_SRP',
          onLongPressed: () => {
            setCompletedLongPress(true);
            setScreen(REVEAL_SEED_SCREEN);
          },
        }),
      );
    } catch (e) {
      trackEvent({
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.KEY_EXPORT_FAILED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
          reason: e.message, // 'incorrect_password',
        },
      });
      setError(e.message);
    }
  };

  const renderWarning = () => {
    return (
      <div className="srp__warning-container">
        <div className="srp__warning-icon">
          <Icon name="warning-filled" color={COLORS.ERROR_DEFAULT} />
        </div>
        <div className="srp__warning-message">
          <Text variant={TEXT.BODY_MD}>
            {t('revealSeedWordsWarning', [
              <Text
                key="reveal-seed-words-warning-2"
                variant={TEXT.BODY_MD_BOLD}
                as="span"
              >
                {t('revealSeedWordsWarning2')}
              </Text>,
            ])}
          </Text>
        </div>
      </div>
    );
  };

  const renderPasswordPromptContent = () => {
    return (
      <form onSubmit={(event) => handleSubmit(event)}>
        <Label htmlFor="password-box" variant={TEXT.BODY_MD_BOLD}>
          {t('enterPasswordContinue')}
        </Label>
        <div className="input-group">
          <input
            data-testid="input-password"
            type="password"
            placeholder={t('makeSureNoOneWatching')}
            id="password-box"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={classnames('form-control', {
              'form-control--error': error,
            })}
          />
        </div>
        {error && <div className="reveal-seed__error">{error}</div>}
      </form>
    );
  };

  const renderRevealSeedContent = () => {
    return (
      <div>
        <Tabs defaultActiveTabName={t('revealSeedWordsText')}>
          <Tab
            name={t('revealSeedWordsText')}
            className="reveal-seed__tab"
            activeClassName="reveal-seed__active-tab"
          >
            <div className="reveal-seed__text-container">
              <Label variant={TEXT.BODY_MD_BOLD}>
                {t('yourPrivateSeedPhrase')}
              </Label>
              <ExportTextContainer
                text={seedWords}
                onClickCopy={() => {
                  trackEvent({
                    category: EVENT.CATEGORIES.KEYS,
                    event: EVENT_NAMES.KEY_EXPORT_COPIED,
                    properties: {
                      key_type: EVENT.KEY_TYPES.SRP,
                      copy_method: 'clipboard',
                    },
                  });
                }}
              />
            </div>
          </Tab>
          <Tab
            name={t('revealSeedWordsQR')}
            className="reveal-seed__tab"
            activeClassName="reveal-seed__active-tab"
          >
            <div className="reveal-seed__qr-container">
              <div
                className="qr-code__wrapper"
                dangerouslySetInnerHTML={{
                  __html: renderQR().createTableTag(7),
                }}
              />
            </div>
          </Tab>
        </Tabs>
      </div>
    );
  };

  const renderPasswordPromptFooter = () => {
    return (
      <div className="page-container__footer srp__footer">
        <footer>
          <Button
            type="secondary"
            large
            className="page-container__footer-button"
            onClick={() => {
              trackEvent({
                category: EVENT.CATEGORIES.KEYS,
                event: EVENT_NAMES.KEY_EXPORT_CANCELED,
                properties: {
                  key_type: EVENT.KEY_TYPES.SRP,
                },
              });
              history.push(mostRecentOverviewPage);
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            type="primary"
            large
            className="page-container__footer-button"
            onClick={(event) => {
              trackEvent({
                category: EVENT.CATEGORIES.KEYS,
                event: EVENT_NAMES.KEY_EXPORT_REQUESTED,
                properties: {
                  key_type: EVENT.KEY_TYPES.SRP,
                },
              });
              handleSubmit(event);
            }}
            disabled={password === ''}
          >
            {t('next')}
          </Button>
        </footer>
      </div>
    );
  };

  const renderRevealSeedFooter = () => {
    return (
      <div className="page-container__footer srp__footer-revealed">
        <Button
          type="secondary"
          large
          className="page-container__footer-button"
          onClick={() => history.push(mostRecentOverviewPage)}
        >
          <Text variant={TEXT.BODY_MD} color={COLORS.PRIMARY_DEFAULT}>
            {t('close')}
          </Text>
        </Button>
      </div>
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
    <div className="page-container">
      <div className="srp__header">
        <Text variant={TEXT.HEADING_LG}>{t('secretRecoveryPhrase')}</Text>
      </div>
      <div className="srp__content">
        <Text variant={TEXT.BODY_MD}>
          {t('revealSeedWordsDescription1', [
            <Button
              key="srp-learn-more-non-custodial"
              type="link"
              href={ZENDESK_URLS.NON_CUSTODIAL_WALLET}
              target="_blank"
              rel="noopener noreferrer"
              className="srp__inline-link"
            >
              {t('revealSeedWordsSRPName')}
            </Button>,
            <Text
              key="reveal-seed-word-part-3"
              variant={TEXT.BODY_MD_BOLD}
              as="span"
            >
              {t('revealSeedWordsDescription3')}
            </Text>,
          ])}
        </Text>
        <br />
        <Text variant={TEXT.BODY_MD}>
          {t('revealSeedWordsDescription2', [
            <Button
              key="srp-learn-more-non-custodial"
              type="link"
              href={ZENDESK_URLS.NON_CUSTODIAL_WALLET}
              target="_blank"
              rel="noopener noreferrer"
              className="srp__inline-link"
            >
              {t('revealSeedWordsNonCustodialWallet')}
            </Button>,
          ])}
        </Text>
        {renderWarning()}
        <div className="reveal-seed__content"> {renderContent()}</div>
      </div>
      {renderFooter()}
    </div>
  );
};

export default RevealSeedPage;
