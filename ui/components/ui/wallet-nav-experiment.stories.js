import React, { useState } from 'react';

import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  DISPLAY,
  ALIGN_ITEMS,
  COLORS,
} from '../../helpers/constants/design-system';
import Box from './box';
import Typography from './typography';

export default {
  title: 'IANav/WalletExperiment', // title should follow the folder structure location of the component. Don't use spaces.
  id: __filename,
};

export const DefaultStory = () => {
  const [activeLink, setActiveLink] = useState('wallet');
  return (
    <Box backgroundColor={COLORS.UI1} padding={8}>
      <ul>
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={4}
          onClick={() => setActiveLink('wallet')}
        >
          <Typography
            tag="i"
            className="fa fa-wallet"
            color={activeLink === 'wallet' ? COLORS.PRIMARY1 : COLORS.BLACK}
          />
          <Typography
            boxProps={{ margin: 0, marginLeft: 4 }}
            fontWeight={activeLink === 'wallet' ? FONT_WEIGHT.BOLD : null}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'wallet' ? COLORS.PRIMARY1 : COLORS.BLACK}
          >
            Wallet
          </Typography>
        </Box>

        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={4}
          onClick={() => setActiveLink('exploreWeb3')}
        >
          <Typography
            tag="i"
            className="fa fa-th"
            color={
              activeLink === 'exploreWeb3' ? COLORS.PRIMARY1 : COLORS.BLACK
            }
          />
          <Typography
            boxProps={{ marginLeft: 4 }}
            fontWeight={activeLink === 'exploreWeb3' ? FONT_WEIGHT.BOLD : null}
            variant={TYPOGRAPHY.H6}
            color={
              activeLink === 'exploreWeb3' ? COLORS.PRIMARY1 : COLORS.BLACK
            }
          >
            Explore Web3
          </Typography>
        </Box>

        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={4}
          onClick={() => setActiveLink('contacts')}
        >
          <Typography
            tag="i"
            className="fa fa-address-book"
            color={activeLink === 'contacts' ? COLORS.PRIMARY1 : COLORS.BLACK}
          />
          <Typography
            boxProps={{ marginLeft: 4 }}
            fontWeight={activeLink === 'contacts' ? FONT_WEIGHT.BOLD : null}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'contacts' ? COLORS.PRIMARY1 : COLORS.BLACK}
          >
            Contacts
          </Typography>
        </Box>
      </ul>
    </Box>
  );
};

DefaultStory.storyName = 'Default';
