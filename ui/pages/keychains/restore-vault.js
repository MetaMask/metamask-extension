import React, { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  createNewVaultAndRestore,
  unMarkPasswordForgotten,
  initializeThreeBox,
} from '../../store/actions';
import { isLoading } from '../../ducks/app/app';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import CreateNewVault from '../../components/app/create-new-vault/create-new-vault';

const parseSeedPhrase = (seedPhrase) =>
  (seedPhrase || '').trim().toLowerCase().match(/\w+/gu)?.join(' ') || '';

export default function RestoreVaultPage() {
  const t = useI18nContext();
  const metricsEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const loading = useSelector(isLoading);
  const onImport = useCallback(
    (password, seedPhrase) => {
      dispatch(unMarkPasswordForgotten());
      dispatch(
        createNewVaultAndRestore(password, parseSeedPhrase(seedPhrase)),
      ).then(() => {
        metricsEvent({
          eventOpts: {
            category: 'Retention',
            action: 'userEntersSeedPhrase',
            name: 'onboardingRestoredVault',
          },
        });
        dispatch(initializeThreeBox());
        history.push(DEFAULT_ROUTE);
      });
    },
    [dispatch, history, metricsEvent],
  );

  return (
    <div className="first-view-main-wrapper">
      <div className="first-view-main">
        <div className="import-account">
          <a
            className="import-account__back-button"
            onClick={(e) => {
              e.preventDefault();
              dispatch(unMarkPasswordForgotten());
              history.goBack();
            }}
            href="#"
          >
            {`< ${t('back')}`}
          </a>
          <div className="import-account__title">
            {t('restoreAccountWithSeed')}
          </div>
          <div className="import-account__selector-label">
            {t('secretPhrase')}
          </div>
          <div className="import-account__selector-typography">
            {t('secretPhraseWarning')}
          </div>
          <CreateNewVault
            disabled={loading}
            onSubmit={onImport}
            submitText={t('restore')}
          />
        </div>
      </div>
    </div>
  );
}
