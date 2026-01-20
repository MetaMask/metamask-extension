import React from 'react';
import PropTypes from 'prop-types';
import { Box, Text } from '../../../components/component-library';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  JustifyContent,
  TextVariant,
  AlignItems,
  Display,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

type SettingProps = {
  value?: boolean;
  setValue?: (value: boolean) => void;
  title?: string;
  description: string | React.ReactNode;
  showToggle?: boolean;
  dataTestId?: string;
  disabled?: boolean;
  enableMarginBottom?: boolean;
};

export const Setting = ({
  value,
  setValue,
  title,
  description,
  showToggle = true,
  dataTestId,
  disabled = false,
  enableMarginBottom = true,
}: SettingProps) => {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.flexStart}
      marginTop={3}
      marginBottom={enableMarginBottom ? 3 : 0}
      className="privacy-settings__setting__wrapper"
      data-testid={dataTestId}
    >
      <div className="privacy-settings__setting">
        <Text variant={TextVariant.bodyMdMedium}>{title}</Text>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          as="div"
        >
          {description}
        </Text>
      </div>
      {showToggle ? (
        <div className="privacy-settings__setting__toggle">
          <ToggleButton
            value={value}
            onToggle={(val) => setValue?.(!val)}
            offLabel={t('off')}
            onLabel={t('on')}
            disabled={disabled}
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
  dataTestId: PropTypes.string,
  disabled: PropTypes.bool,
};
