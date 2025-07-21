import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../../components/component-library';
import Tooltip from '../../../../../components/ui/tooltip';
import {
  BackgroundColor,
  BorderRadius,
  IconColor,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { setConfirmationAdvancedDetailsOpen } from '../../../../../store/actions';
import { selectConfirmationAdvancedDetailsOpen } from '../../../selectors/preferences';

export const AdvancedDetailsButton = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const setShowAdvancedDetails = (value: boolean): void => {
    dispatch(setConfirmationAdvancedDetailsOpen(value));
  };

  return (
    <Box
      backgroundColor={
        showAdvancedDetails
          ? BackgroundColor.infoMuted
          : BackgroundColor.transparent
      }
      borderRadius={BorderRadius.MD}
      marginRight={1}
    >
      <Tooltip
        title={
          showAdvancedDetails
            ? t('hideAdvancedDetails')
            : t('showAdvancedDetails')
        }
      >
        <ButtonIcon
          ariaLabel="Advanced tx details"
          color={IconColor.iconDefault}
          iconName={IconName.Customize}
          data-testid="header-advanced-details-button"
          size={ButtonIconSize.Md}
          onClick={() => {
            setShowAdvancedDetails(!showAdvancedDetails);
          }}
        />
      </Tooltip>
    </Box>
  );
};
