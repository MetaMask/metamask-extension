import React from 'react';
import PropTypes from 'prop-types';
import {
  BannerAlert,
  ButtonIcon,
  ButtonPrimary,
  IconName,
  Text,
  Box,
} from '../../component-library';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  Severity,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

export const AccountDetailsKey = ({ accountName, onClose, privateKey }) => {
  const t = useI18nContext();

  const [privateKeyCopied, handlePrivateKeyCopy] = useCopyToClipboard();

  return (
    <>
      <Text
        marginTop={6}
        variant={TextVariant.bodySm}
        style={{ wordBreak: 'break-word' }}
      >
        {t('privateKeyCopyWarning', [accountName])}
      </Text>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        borderRadius={BorderRadius.SM}
        borderWidth={1}
        borderColor={BorderColor.default}
        padding={4}
        gap={4}
      >
        <Text variant={TextVariant.bodySm} style={{ wordBreak: 'break-word' }}>
          {privateKey}
        </Text>
        <ButtonIcon
          onClick={() => handlePrivateKeyCopy(privateKey)}
          iconName={privateKeyCopied ? IconName.CopySuccess : IconName.Copy}
        />
      </Box>
      <BannerAlert severity={Severity.Danger} marginTop={4}>
        <Text variant={TextVariant.bodySm}>{t('privateKeyWarning')}</Text>
      </BannerAlert>
      <ButtonPrimary marginTop={6} onClick={onClose}>
        {t('done')}
      </ButtonPrimary>
    </>
  );
};

AccountDetailsKey.propTypes = {
  accountName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  privateKey: PropTypes.string.isRequired,
};
