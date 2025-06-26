import React from 'react';

import {
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../components/component-library';
import {
  IconColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
} from '../../helpers/constants/design-system';
import IconButton from '../../components/ui/icon-button';

const PredictNavigation = () => {
  console.log(window.location.hash);
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      textAlign={TextAlign.Center}
      marginTop={2}
      marginBottom={2}
    >
      <IconButton
        className={'markets__button'}
        Icon={
          <Icon
            name={IconName.Storefront}
            color={
              window.location.hash === '#predict'
                ? IconColor.warningDefault
                : IconColor.iconDefault
            }
            size={IconSize.Sm}
          />
        }
        label={'Markets'}
        onClick={() => {
          window.location.hash = 'predict';
        }}
        width={BlockSize.Full}
        round={true}
      />
      <IconButton
        className={'orders__button'}
        Icon={
          <Icon
            name={IconName.Bank}
            size={IconSize.Sm}
            color={
              window.location.hash === '#predict-orders'
                ? IconColor.warningDefault
                : IconColor.iconDefault
            }
          />
        }
        label={'Orders'}
        onClick={() => {
          window.location.hash = 'predict-orders';
        }}
        width={BlockSize.Full}
        round={true}
      />
      <IconButton
        className={'positions__button'}
        Icon={
          <Icon
            name={IconName.Chart}
            color={
              window.location.hash === '#predict-positions'
                ? IconColor.warningDefault
                : IconColor.iconDefault
            }
            size={IconSize.Sm}
          />
        }
        label={'Positions'}
        onClick={() => {
          window.location.hash = 'predict-positions';
        }}
        width={BlockSize.Full}
        round={true}
      />
      <IconButton
        className={'profit__button'}
        Icon={
          <Icon
            name={IconName.Money}
            color={
              window.location.hash === '#predict-profit'
                ? IconColor.warningDefault
                : IconColor.iconDefault
            }
            size={IconSize.Sm}
          />
        }
        label={'Profit'}
        onClick={() => {
          window.location.hash = 'predict-profit';
        }}
        width={BlockSize.Full}
        round={true}
      />
      <IconButton
        className={'settings__button'}
        Icon={
          <Icon
            name={IconName.Setting}
            size={IconSize.Sm}
            color={
              window.location.hash === '#predict-profit'
                ? IconColor.warningDefault
                : IconColor.iconDefault
            }
          />
        }
        label={'Settings'}
        onClick={() => {
          window.location.hash = 'predict-settings';
        }}
        width={BlockSize.Full}
        round={true}
      />
    </Box>
  );
};

export default PredictNavigation;
