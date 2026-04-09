import React, { useState } from 'react';
import {
  LavaDome as LavaDomeReact,
  toLavaDomeToken,
} from '@lavamoat/lavadome-react';
import PropTypes from 'prop-types';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonVariant,
  IconName,
  OverflowWrap,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  BannerAlert,
  HelpText,
  HelpTextSeverity,
} from '../../component-library';

import { Severity } from '../../../helpers/constants/design-system';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MINUTE } from '../../../../shared/constants/time';

const inTest = Boolean(process.env.IN_TEST);

export const AccountDetailsKey = ({ accountName, onClose, privateKey }) => {
  const t = useI18nContext();

  const [showSelectDisableWarn, setShowDisableSelectWarn] = useState(false);

  // useCopyToClipboard analysis: Copies your private key
  const [privateKeyCopied, handlePrivateKeyCopy] = useCopyToClipboard({
    clearDelayMs: MINUTE,
  });

  return (
    <>
      <Text
        className="mt-6"
        variant={TextVariant.BodySm}
        overflowWrap={OverflowWrap.BreakWord}
      >
        {t('privateKeyCopyWarning', [accountName])}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        borderWidth={1}
        borderColor={BoxBorderColor.BorderDefault}
        padding={4}
        gap={4}
        className="rounded-sm"
      >
        <Text
          data-testid="account-details-key"
          variant={TextVariant.BodySm}
          overflowWrap={OverflowWrap.BreakWord}
          onClick={() => setShowDisableSelectWarn(true)}
        >
          <LavaDomeReact
            unsafeOpenModeShadow={inTest}
            text={toLavaDomeToken(privateKey)}
          />
        </Text>
        <ButtonIcon
          onClick={() =>
            setShowDisableSelectWarn(false) || handlePrivateKeyCopy(privateKey)
          }
          iconName={privateKeyCopied ? IconName.CopySuccess : IconName.Copy}
          size={ButtonIconSize.Md}
          ariaLabel={t('copyPrivateKey')}
        />
      </Box>
      {showSelectDisableWarn && (
        <HelpText marginTop={2} severity={HelpTextSeverity.Danger}>
          {t('lavaDomeCopyWarning')}
        </HelpText>
      )}
      <BannerAlert severity={Severity.Danger} marginTop={4}>
        <Text variant={TextVariant.BodySm}>{t('privateKeyWarning')}</Text>
      </BannerAlert>
      <Button
        variant={ButtonVariant.Primary}
        className="mt-6"
        onClick={onClose}
        isFullWidth
      >
        {t('done')}
      </Button>
    </>
  );
};

AccountDetailsKey.propTypes = {
  /**
   * Name of the account
   */
  accountName: PropTypes.string.isRequired,
  /**
   * Executes upon Close button click
   */
  onClose: PropTypes.func.isRequired,
  /**
   * The private key
   */
  privateKey: PropTypes.string.isRequired,
};
