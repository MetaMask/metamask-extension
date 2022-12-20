import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import { requestRevealSeedWords, showModal } from '../../store/actions';
import ExportTextContainer from '../../components/ui/export-text-container';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';

import Button from '../../components/ui/button';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';

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
  const [error, setError] = useState(null);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  useEffect(() => {
    const passwordBox = document.getElementById('password-box');
    if (passwordBox) {
      passwordBox.focus();
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSeedWords(null);
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
        setScreen(REVEAL_SEED_SCREEN);
      });
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
      <div className="page-container__warning-container">
        <i className="fa fa-exclamation-triangle fa-2x page-container__warning-icon" />
        <div className="page-container__warning-message">
          <div className="page-container__warning-title">
            {t('revealSeedWordsWarningTitle')}
          </div>
          <div>{t('revealSeedWordsWarning')}</div>
        </div>
      </div>
    );
  };

  const renderPasswordPromptContent = () => {
    return (
      <form onSubmit={(event) => handleSubmit(event)}>
        <label className="input-label" htmlFor="password-box">
          {t('enterPasswordContinue')}
        </label>
        <div className="input-group">
          <input
            data-testid="input-password"
            type="password"
            placeholder={t('password')}
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
        <label className="reveal-seed__label">
          {t('yourPrivateSeedPhrase')}
        </label>
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
          onClickDownload={() => {
            trackEvent({
              category: EVENT.CATEGORIES.KEYS,
              event: EVENT_NAMES.KEY_EXPORT_COPIED,
              properties: {
                key_type: EVENT.KEY_TYPES.SRP,
                copy_method: 'file_download',
              },
            });
          }}
        />
      </div>
    );
  };

  const renderPasswordPromptFooter = () => {
    return (
      <div className="page-container__footer">
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
      <div className="page-container__footer">
        <Button
          type="secondary"
          large
          className="page-container__footer-single-button"
          onClick={() => history.push(mostRecentOverviewPage)}
        >
          {t('close')}
        </Button>
      </div>
    );
  };

  const renderContent = () => {
    if (screen === PASSWORD_PROMPT_SCREEN) {
      return renderPasswordPromptContent();
    }
    return renderRevealSeedContent();
  };

  const renderFooter = () => {
    return screen === PASSWORD_PROMPT_SCREEN
      ? renderPasswordPromptFooter()
      : renderRevealSeedFooter();
  };

  return (
    <div className="page-container">
      <div className="page-container__header">
        <div className="page-container__title">{t('secretRecoveryPhrase')}</div>
        <div className="page-container__subtitle">
          {t('revealSeedWordsDescription')}
        </div>
      </div>
      <div className="page-container__content">
        {renderWarning()}
        <div className="reveal-seed__content">{renderContent()}</div>
      </div>
      {renderFooter()}
    </div>
  );
};

// const mapDispatchToProps = (dispatch) => {
//   return {
//     requestRevealSeedWords: (password) =>
//       dispatch(requestRevealSeedWords(password)),
//     showLongPressWarningModal: ({ target, onConfirm }) => {
//       return dispatch(
//         showModal({
//           name: '',
//           target,
//           onConfirm,
//         }),
//       );
//     },
//   };
// };

export default RevealSeedPage;
