import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  IconName,
  Text,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export const SiteCellConnectionListItem = ({
  title,
  iconName,
  connectedMessage,
  unconnectedMessage,
  isConnectFlow,
  onClick,
  content,
}) => {
  const t = useI18nContext();

  return (
    <Box
      data-testid="site-cell-connection-list-item"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      padding={4}
      gap={4}
      className="multichain-connection-list-item"
    >
      <AvatarIcon
        iconName={iconName}
        size={AvatarIconSize.Md}
        color={IconColor.iconAlternative}
        backgroundColor={BackgroundColor.backgroundAlternative}
      />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.FiveTwelfths}
        style={{ alignSelf: 'center', flexGrow: 1 }}
      >
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Left} ellipsis>
          {title}
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={1}
        >
          <Text
            as="span"
            width={BlockSize.Max}
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMd}
            ellipsis
          >
            {isConnectFlow ? unconnectedMessage : connectedMessage}
          </Text>
          {content}
        </Box>
      </Box>
      {isConnectFlow ? (
        <ButtonLink onClick={() => onClick()}>{t('edit')}</ButtonLink>
      ) : (
        <ButtonIcon
          iconName={IconName.MoreVertical}
          data-testid="site-cell-edit-button"
          ariaLabel={t('edit')}
          onClick={() => onClick()}
          size={ButtonIconSize.Sm}
        />
      )}
    </Box>
  );
};
SiteCellConnectionListItem.propTypes = {
  /**
   * Title that should be displayed in the connection list item
   */
  title: PropTypes.string,

  /**
   * The name of the icon that should be passed to the AvatarIcon component
   */
  iconName: PropTypes.string,

  /**
   * The message that should be displayed when there are connected accounts
   */
  connectedMessage: PropTypes.string,

  /**
   * The message that should be displayed when there are no connected accounts
   */
  unconnectedMessage: PropTypes.string,

  /**
   * If the component should show context related to adding a connection or editing one
   */
  isConnectFlow: PropTypes.bool,

  /**
   * Handler called when the edit button is clicked
   */
  onClick: PropTypes.func,

  /**
   * Components to display in the connection list item
   */
  content: PropTypes.node,
};
