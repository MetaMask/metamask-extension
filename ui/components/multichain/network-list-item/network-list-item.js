import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';
import {
  AlignItems,
  IconColor,
  BorderRadius,
  Color,
  Size,
  JustifyContent,
  TextColor,
  BLOCK_SIZES,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  ButtonIcon,
  ButtonLink,
  IconName,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Tooltip from '../../ui/tooltip/tooltip';
import {
  GOERLI_DISPLAY_NAME,
  LINEA_TESTNET_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../../shared/constants/network';

const MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP = 17;

function getAvatarNetworkColor(name) {
  switch (name) {
    case GOERLI_DISPLAY_NAME:
      return BackgroundColor.goerli;
    case LINEA_TESTNET_DISPLAY_NAME:
      return BackgroundColor.lineaTestnet;
    case SEPOLIA_DISPLAY_NAME:
      return BackgroundColor.sepolia;
    default:
      return undefined;
  }
}

export const NetworkListItem = ({
  name,
  iconSrc,
  selected = false,
  onClick,
  onDeleteClick,
}) => {
  const t = useI18nContext();
  const networkRef = useRef();

  useEffect(() => {
    if (networkRef.current && selected) {
      networkRef.current.querySelector('.mm-button-link').focus();
    }
  }, [networkRef, selected]);

  const networkAvatarColor = getAvatarNetworkColor(name);


  return (
    <Box
      onClick={onClick}
      padding={4}
      gap={2}
      backgroundColor={selected ? Color.primaryMuted : Color.transparent}
      className={classnames('multichain-network-list-item', {
        'multichain-network-list-item--selected': selected,
      })}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      width={BLOCK_SIZES.FULL}
      ref={networkRef}
    >
      {selected && (
        <Box
          className="multichain-network-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={Color.primaryDefault}
        />
      )}
      <AvatarNetwork
        backgroundColor={getAvatarNetworkColor(name)}
        name={name}
        src={iconSrc}
      />
      <Box className="multichain-network-list-item__network-name">
        <ButtonLink
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          color={TextColor.textDefault}
          ellipsis
        >
          {name.length > MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP ? (
            <Tooltip
              title={name}
              position="bottom"
              wrapperClassName="multichain-network-list-item__tooltip"
            >
              {name}
            </Tooltip>
          ) : (
            name
          )}
        </ButtonLink>
      </Box>
      {onDeleteClick ? (
        <ButtonIcon
          className="multichain-network-list-item__delete"
          color={IconColor.errorDefault}
          iconName={IconName.Trash}
          ariaLabel={t('deleteNetwork')}
          size={Size.SM}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
        />
      ) : null}
    </Box>
  );
};

NetworkListItem.propTypes = {
  /**
   * The name of the network
   */
  name: PropTypes.string.isRequired,
  /**
   * Path to the Icon image
   */
  iconSrc: PropTypes.string,
  /**
   * Represents if the network item is selected
   */
  selected: PropTypes.bool,
  /**
   * Executes when the item is clicked
   */
  onClick: PropTypes.func.isRequired,
  /**
   * Executes when the delete icon is clicked
   */
  onDeleteClick: PropTypes.func,
};
