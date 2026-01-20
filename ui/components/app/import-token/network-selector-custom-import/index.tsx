import React from 'react';
import {
  TextVariant,
  TextColor,
  BorderRadius,
  AlignItems,
  Display,
  JustifyContent,
  BorderColor,
} from '../../../../helpers/constants/design-system';
import {
  ButtonIcon,
  Box,
  ButtonIconSize,
  IconName,
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../../component-library';
import { getImageForChainId } from '../../../../selectors/multichain';

export const NetworkSelectorCustomImport = ({
  title,
  buttonDataTestId,
  chainId,
  onSelectNetwork,
}: {
  title: string;
  buttonDataTestId: string;
  chainId: string;
  onSelectNetwork: () => void;
}) => {
  const networkImageUrl = getImageForChainId(chainId);

  return (
    <Box padding={4} onClick={onSelectNetwork} data-testid={buttonDataTestId}>
      <Box
        className="dropdown-editor__item-dropdown"
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        borderRadius={BorderRadius.LG}
        borderColor={BorderColor.borderDefault}
        borderWidth={1}
        paddingLeft={4}
        paddingRight={2}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textDefault}
          paddingTop={3}
          paddingBottom={3}
        >
          {title}
        </Text>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          marginLeft="auto"
        >
          {networkImageUrl ? (
            <AvatarNetwork
              key={networkImageUrl}
              name={networkImageUrl ?? ''}
              src={networkImageUrl ?? undefined}
              size={AvatarNetworkSize.Sm}
            />
          ) : null}
          <ButtonIcon
            marginLeft="auto"
            iconName={IconName.ArrowRight}
            size={ButtonIconSize.Sm}
            ariaLabel={title}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default NetworkSelectorCustomImport;
