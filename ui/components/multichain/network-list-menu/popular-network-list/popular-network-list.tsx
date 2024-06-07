import React from 'react';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Box,
  Text,
  AvatarNetwork,
  Button,
  AvatarNetworkSize,
  ButtonVariant,
} from '../../../component-library';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../shared/constants/app';
import { ADD_NETWORK_ROUTE } from '../../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import NetworkConfirmationPopover from '../network-confirmation-popover/network-confirmation-popover';

const PopularNetworkList = ({ searchAddNetworkResults }: any) => {
  const t = useI18nContext();
  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const history = useHistory();

  if (Object.keys(searchAddNetworkResults).length === 0) {
    return (
      <Box
        className="add-network__edge-case-box"
        borderRadius={BorderRadius.MD}
        padding={4}
        marginTop={4}
        marginRight={6}
        marginLeft={6}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        backgroundColor={BackgroundColor.backgroundAlternative}
      >
        <Box marginRight={4}>
          <img src="images/info-fox.svg" />
        </Box>
        <Box>
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            data-testid="all-networks-added"
          >
            {t('youHaveAddedAll', [
              <a
                key="link"
                className="add-network__edge-case-box__link"
                href="https://chainlist.wtf/"
                target="_blank"
                rel="noreferrer"
              >
                {t('here')}.
              </a>,
              <Button
                key="button"
                type="inline"
                onClick={(event: any) => {
                  event.preventDefault();
                  if (isPopUp) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment, spaced-comment
                    //@ts-ignore
                    platform.openExtensionInBrowser(ADD_NETWORK_ROUTE);
                  } else {
                    history.push(ADD_NETWORK_ROUTE);
                  }
                }}
              >
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.infoDefault}
                >
                  {t('addMoreNetworks')}.
                </Text>
              </Button>,
            ])}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="new-network-list__networks-container">
      <Box
        marginTop={isPopUp ? 0 : 4}
        marginBottom={1}
        paddingLeft={4}
        paddingRight={4}
      >
        <Box
          marginTop={4}
          marginBottom={8}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Text> {t('additionalNetworks')}</Text>
        </Box>
        {searchAddNetworkResults.map((item: any, index: number) => (
          <Box
            key={index}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            marginBottom={6}
            className="new-network-list__list-of-networks"
          >
            <Box display={Display.Flex} alignItems={AlignItems.center}>
              <AvatarNetwork
                size={AvatarNetworkSize.Md}
                src={item.rpcPrefs?.imageUrl}
                name={item.nickname}
              />
              <Box marginLeft={2}>
                <Text
                  color={TextColor.textDefault}
                  backgroundColor={BackgroundColor.transparent}
                  ellipsis
                >
                  {item.nickname}
                </Text>
              </Box>
            </Box>
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              marginLeft={1}
            >
              <Button
                type={ButtonVariant.Link}
                className="add-network__add-button"
                variant={ButtonVariant.Link}
                data-testid="test-add-button"
              >
                {t('add')}
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
      <Box padding={isPopUp ? [2, 0, 2, 6] : [2, 0, 2, 0]}></Box>
      <NetworkConfirmationPopover />
    </Box>
  );
};

export default PopularNetworkList;
