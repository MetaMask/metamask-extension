import React, { useCallback } from 'react';
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
import ActionableMessage from '../../ui/actionable-message/actionable-message';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
} from '../../component-library';
import { Display } from '../../../helpers/constants/design-system';
import { SECOND } from '../../../../shared/constants/time';

export function ImportedTokensNotificationContainer() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const newTokensImported = useSelector(getNewTokensImported);
  const newTokensImportedError = useSelector(getNewTokensImportedError);

  const autoHideDelay = 5 * SECOND;

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

  if (!newTokensImported && !newTokensImportedError) {
    return null;
  }

  return (
    <>
      {newTokensImported ? (
        <ActionableMessage
          type="success"
          autoHideTime={autoHideDelay}
          onAutoHide={onAutoHide}
          className="home__new-tokens-imported-notification"
          message={
            <Box display={Display.InlineFlex}>
              <i className="fa fa-check-circle home__new-tokens-imported-notification-icon" />
              <Box>
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
              </Box>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={onDismissImport}
                className="home__new-tokens-imported-notification-close"
              />
            </Box>
          }
        />
      ) : null}
      {newTokensImportedError ? (
        <ActionableMessage
          type="danger"
          className="home__new-tokens-imported-notification"
          autoHideTime={autoHideDelay}
          onAutoHide={onAutoHide}
          message={
            <Box display={Display.InlineFlex}>
              <Icon name={IconName.Danger} marginRight={1} />
              <Text variant={TextVariant.BodySm} asChild>
                <h6>{t('importTokensError')}</h6>
              </Text>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={onDismissError}
              />
            </Box>
          }
        />
      ) : null}
    </>
  );
}
