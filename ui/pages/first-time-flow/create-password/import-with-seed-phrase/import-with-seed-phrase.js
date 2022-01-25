import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  INITIALIZE_SELECT_ACTION_ROUTE,
  INITIALIZE_END_OF_FLOW_ROUTE,
} from '../../../../helpers/constants/routes';
import {
  setSeedPhraseBackedUp,
  initializeThreeBox,
} from '../../../../store/actions';
import CreateNewVault from '../../../../components/app/create-new-vault';

export const parseSeedPhrase = (seedPhrase) =>
  (seedPhrase || '').trim().toLowerCase().match(/\w+/gu)?.join(' ') || '';

export default function ImportWithSeedPhrase({ onSubmit }) {
  const t = useI18nContext();
  const metricsEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const dispatch = useDispatch();

  const onBeforeUnload = useCallback(
    () =>
      metricsEvent({
        eventOpts: {
          category: 'Onboarding',
          action: 'Import Seed Phrase',
          name: 'Close window on import screen',
        },
      }),
    [metricsEvent],
  );

  useEffect(() => {
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [onBeforeUnload]);

  const onImport = useCallback(
    async (password, seedPhrase) => {
      await onSubmit(password, parseSeedPhrase(seedPhrase));
      metricsEvent({
        eventOpts: {
          category: 'Onboarding',
          action: 'Import Seed Phrase',
          name: 'Import Complete',
        },
      });

      dispatch(setSeedPhraseBackedUp(true)).then(async () => {
        dispatch(initializeThreeBox());
        history.replace(INITIALIZE_END_OF_FLOW_ROUTE);
      });
    },
    [dispatch, history, onSubmit, metricsEvent],
  );

  return (
    <div className="first-time-flow__import">
      <div className="first-time-flow__create-back">
        <a
          onClick={(e) => {
            e.preventDefault();
            metricsEvent({
              eventOpts: {
                category: 'Onboarding',
                action: 'Import Seed Phrase',
                name: 'Go Back from Onboarding Import',
              },
            });
            history.push(INITIALIZE_SELECT_ACTION_ROUTE);
          }}
          href="#"
        >
          {`< ${t('back')}`}
        </a>
      </div>
      <div className="first-time-flow__header">
        {t('importAccountSeedPhrase')}
      </div>
      <div className="first-time-flow__text-block">{t('secretPhrase')}</div>
      <CreateNewVault
        includeTerms
        onSubmit={onImport}
        submitText={t('import')}
      />
    </div>
  );
}

ImportWithSeedPhrase.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
