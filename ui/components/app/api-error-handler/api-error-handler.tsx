import React from 'react';
import browser from 'webextension-polyfill';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import classnames from 'classnames';

const ApiErrorHandler = ({ className = '' }: { className?: string }) => {
  const t = useI18nContext();

  return (
    <Box
      className={classnames(
        'flex flex-col items-center text-center gap-4',
        className,
      )}
    >
      <Icon
        className="w-12 h-12"
        name={IconName.Error}
        color={IconColor.IconAlternative}
      />
      <Text variant={TextVariant.BodyMd}>{t('shieldPlanErrorText')}</Text>
      <Button
        className="w-full"
        size={ButtonSize.Lg}
        variant={ButtonVariant.Primary}
        // this reloads the entire extension
        onClick={() => browser.runtime.reload()}
      >
        {t('tryAgain')}
      </Button>
    </Box>
  );
};

export default ApiErrorHandler;
