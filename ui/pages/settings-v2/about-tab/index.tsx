import React from 'react';
import { Box } from '@metamask/design-system-react';
import InfoTab from '../../settings/info-tab/info-tab';
import { Divider } from '../shared';

const AboutTab = () => {
  return (
    <Box paddingTop={4}>
      <Divider />
      <InfoTab />
    </Box>
  );
};

export default AboutTab;
