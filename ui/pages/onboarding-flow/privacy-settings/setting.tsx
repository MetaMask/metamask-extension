import React from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import {
  TextVariant as TextVariantComponent,
  TextColor as TextColorComponent,
} from '../../../helpers/constants/design-system';
import { Text as TextComponent } from '../../../components/component-library';
import ToggleButton from '../../../components/ui/toggle-button';
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
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Start}
      marginTop={3}
      marginBottom={enableMarginBottom ? 3 : 0}
      data-testid={dataTestId}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        marginBottom={4}
        className="w-full"
        gap={4}
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
        >
          {title}
        </Text>
        {showToggle ? (
          <Box>
            <ToggleButton
              value={value}
              onToggle={(val) => setValue?.(!val)}
              offLabel={t('off')}
              onLabel={t('on')}
              disabled={disabled}
            />
          </Box>
        ) : null}
      </Box>
      <TextComponent
        variant={TextVariantComponent.bodySm}
        color={TextColorComponent.textAlternative}
        as="div"
        className="w-full"
      >
        {description}
      </TextComponent>
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
