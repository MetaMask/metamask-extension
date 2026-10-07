import React from 'react';
import { AvatarIcon } from '../../components/component-library/avatar-icon/avatar-icon';
import { AvatarIconSize } from '../../components/component-library/avatar-icon/avatar-icon.types';
import { Box } from '../../components/component-library/box/box';
import { IconName } from '../../components/component-library/icon/icon.types';
import { Text } from '../../components/component-library/text/text';
import {
  AlignItems,
  BlockSize,
  BorderStyle,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  OverflowWrap,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header/snap-authorship-header';
import { useI18nContext } from '../../hooks/useI18nContext';

export type CreateSnapAccountProps = {
  snapId: string;
  snapName: string;
  onCancel: () => void;
};

const CreateSnapAccount = ({
  snapId,
  snapName,
  onCancel,
}: CreateSnapAccountProps) => {
  const t = useI18nContext();
  return (
    <Box
      className="create-snap-account-page"
      height={BlockSize.Full}
      width={BlockSize.Full}
      display={Display.Flex}
      borderStyle={BorderStyle.none}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      marginBottom={0}
    >
      <SnapAuthorshipHeader snapId={snapId} onCancel={onCancel} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        padding={4}
        style={{ flexGrow: 1 }}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
        >
          <Box paddingBottom={6}>
            <AvatarIcon
              iconName={IconName.UserCircleAdd}
              size={AvatarIconSize.Xl}
            />
          </Box>
          <Text
            data-testid="create-snap-account-content-title"
            textAlign={TextAlign.Center}
            variant={TextVariant.headingLg}
            paddingBottom={2}
          >
            {t('createSnapAccountTitle')}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Center}
            overflowWrap={OverflowWrap.Anywhere}
            data-testid="create-snap-account-content-description"
          >
            {t('createSnapAccountDescription', [
              <Text
                color={TextColor.inherit}
                variant={TextVariant.inherit}
                fontWeight={FontWeight.Medium}
                key="1"
              >
                {snapName}
              </Text>,
            ])}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateSnapAccount;
