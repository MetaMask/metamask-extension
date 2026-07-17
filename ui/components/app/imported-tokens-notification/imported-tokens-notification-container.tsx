import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getNewTokensImported,
  getNewTokensImportedError,
} from '../../../selectors';
import {
  setNewTokensImported,
  setNewTokensImportedError,
} from '../../../store/actions';
import {
  BannerAlert,
  BannerAlertSeverity,
  Icon,
  IconName,
} from '../../component-library';
import { SECOND } from '../../../../shared/constants/time';

const AUTO_HIDE_DELAY = 5 * SECOND;

export function ImportedTokensNotificationContainer() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const newTokensImported = useSelector(getNewTokensImported);
  const newTokensImportedError = useSelector(getNewTokensImportedError);

  const onDismissImport = useCallback(() => {
    dispatch(setNewTokensImported(''));
  }, [dispatch]);

  const onDismissError = useCallback(() => {
    dispatch(setNewTokensImportedError(''));
  }, [dispatch]);

  const onAutoHide = useCallback(() => {
    dispatch(setNewTokensImported(''));
    dispatch(setNewTokensImportedError(''));
  }, [dispatch]);

  useEffect(() => {
    if (!newTokensImported && !newTokensImportedError) {
      return undefined;
    }
    const timer = setTimeout(onAutoHide, AUTO_HIDE_DELAY);
    return () => clearTimeout(timer);
  }, [newTokensImported, newTokensImportedError, onAutoHide]);

  if (!newTokensImported && !newTokensImportedError) {
    return null;
  }

  return (
    <>
      {newTokensImported ? (
        <BannerAlert
          severity={BannerAlertSeverity.Success}
          className="home__new-tokens-imported-notification"
          onClose={onDismissImport}
        >
          <i className="fa fa-check-circle home__new-tokens-imported-notification-icon" />
          <Text
            className="home__new-tokens-imported-notification-title"
            variant={TextVariant.BodySm}
            asChild
          >
            <h6>{t('newTokensImportedTitle')}</h6>
          </Text>
          <Text
            className="home__new-tokens-imported-notification-message"
            variant={TextVariant.BodySm}
            asChild
          >
            <h6>{t('newTokensImportedMessage', [newTokensImported])}</h6>
          </Text>
        </BannerAlert>
      ) : null}
      {newTokensImportedError ? (
        <BannerAlert
          severity={BannerAlertSeverity.Danger}
          className="home__new-tokens-imported-notification"
          onClose={onDismissError}
        >
          <Icon name={IconName.Danger} marginRight={1} />
          <Text variant={TextVariant.BodySm} asChild>
            <h6>{t('importTokensError')}</h6>
          </Text>
        </BannerAlert>
      ) : null}
    </>
  );
}
