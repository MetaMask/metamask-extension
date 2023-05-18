import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Popover from '../../ui/popover';
import { BUTTON_VARIANT, Button, Text } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  FLEX_DIRECTION,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box';

export default function ConfigureSnapPopup({
  onClose,
  link,
}: {
  onClose: () => void;
  link: string;
}) {
  const t = useI18nContext();
  const popoverRef = useRef();

  return (
    <Popover
      title={t('configureSnapPopupTitle')}
      headerProps={{ padding: [4, 4, 4] }}
      className="whats-new-popup__popover"
      onClose={() => {
        onClose();
      }}
      popoverRef={popoverRef}
      centerTitle
    >
      <Box
        flexDirection={FLEX_DIRECTION.COLUMN}
        justifyContent={JustifyContent.flexStart}
        alignItems={AlignItems.center}
      >
        <img
          src="images/logo/metamask-fox.svg"
          width="53.68px"
          height="49.5px"
          style={{ marginBottom: '16px' }}
        />
        <Text variant={TextVariant.bodyLgMedium} marginBottom={5}>
          {t('configureSnapPopupDescription')}
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          {t('configureSnapPopupLink')}
        </Text>
        <Button
          variant={BUTTON_VARIANT.LINK}
          marginBottom={8}
          onClick={() => {
            global.platform.openTab({
              url: link,
            });
          }}
        >
          {link}
        </Button>
      </Box>
    </Popover>
  );
}

ConfigureSnapPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
};
