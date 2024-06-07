import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { hideNetworkBanner } from '../../../../../store/actions';
import { BannerBase, Box } from '../../../../component-library';
import {
  BackgroundColor,
  Display,
  AlignItems,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';

const NetworkListBanner = ({ showBanner }: { showBanner: boolean }) => {
  const t = useI18nContext();

  if (!showBanner) {
    return null;
  }

  return (
    <BannerBase
      className="network-list-menu__banner"
      marginLeft={4}
      marginRight={4}
      marginBottom={4}
      backgroundColor={BackgroundColor.backgroundAlternative}
      startAccessory={
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          <img src="./images/dragging-animation.svg" alt="drag-and-drop" />
        </Box>
      }
      onClose={() => hideNetworkBanner()}
      description={t('dragAndDropBanner')}
    />
  );
};

export default NetworkListBanner;
