import React from 'react';
import PropTypes from 'prop-types';
import { Box, Text } from '../../../components/component-library';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  JustifyContent,
  TextVariant,
  AlignItems,
  Display,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const Setting = ({
  value,
  setValue,
  title,
  description,
  showToggle = true,
}) => {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
      marginTop={3}
      marginBottom={3}
      className="privacy-settings__setting__wrapper"
    >
      <div className="privacy-settings__setting">
        <Text variant={TextVariant.bodyMdMedium}>{title}</Text>
        <Text variant={TextVariant.bodySm} as="div">
          {description}
        </Text>
      </div>
      {showToggle ? (
        <div className="privacy-settings__setting__toggle">
          <ToggleButton
            value={value}
            onToggle={(val) => setValue(!val)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      ) : null}
    </Box>
  );
};

Setting.propTypes = {
  value: PropTypes.bool,
  setValue: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  showToggle: PropTypes.bool,
};
