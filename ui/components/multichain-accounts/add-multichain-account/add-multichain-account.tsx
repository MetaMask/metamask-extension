import React, { useState } from 'react';
import { AccountWalletId } from '@metamask/account-api';
import { useDispatch } from 'react-redux';
import { Box, Icon, IconName, IconSize, Text } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { createNextMultichainAccountGroup } from '../../../store/actions';

export type AddMultichainAccountProps = {
  walletId: AccountWalletId;
};

export const AddMultichainAccount = ({
  walletId,
}: AddMultichainAccountProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateMultichainAccountClick = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    await dispatch(createNextMultichainAccountGroup(walletId));
    setIsLoading(false);
  };

  return (
    <Box
      className="add-multichain-account"
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.flexStart}
      style={{
        cursor: isLoading ? 'not-allowed' : 'pointer',
      }}
      padding={4}
      onClick={handleCreateMultichainAccountClick}
      data-testid={`add-multichain-account-button`}
      key={`add-multichain-account-button-${walletId}`}
    >
      <Box
        className="add-multichain-account__icon-box"
        backgroundColor={
          isLoading ? BackgroundColor.transparent : BackgroundColor.infoMuted
        }
        borderRadius={BorderRadius.MD}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        marginLeft={1}
        marginRight={4}
      >
        {!isLoading && (
          <Icon
            className="add-multichain-account__icon-box__icon"
            name={IconName.Add}
            color={IconColor.infoDefault}
            size={IconSize.Lg}
          />
        )}
        {isLoading && (
          <Icon
            className="add-multichain-account__icon-box__icon-loading"
            name={IconName.Loading}
            color={IconColor.iconMuted}
            size={IconSize.Lg}
          />
        )}
      </Box>
      <Text
        className="add-multichain-account__text"
        color={isLoading ? TextColor.textMuted : TextColor.infoDefault}
        variant={TextVariant.bodyMdMedium}
      >
        {isLoading
          ? t('createMultichainAccountButtonLoading')
          : t('createMultichainAccountButton')}
      </Text>
    </Box>
  );
};
