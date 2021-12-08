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
          marginBottom={10}
          onClick={() => setActiveLink('wallet')}
          style={{ cursor: 'pointer', width: 'max-content' }}
        >
          <Typography
            tag="i"
            className="fa fa-wallet"
            color={activeLink === 'wallet' ? COLORS.PRIMARY1 : COLORS.UI4}
          />
          <Typography
            boxProps={{ margin: 0, marginLeft: 4, padding: [2, 0] }}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'wallet' ? COLORS.PRIMARY1 : COLORS.UI4}
            fontWeight={activeLink === 'wallet' ? FONT_WEIGHT.BOLD : null}
            style={
              activeLink === 'wallet'
                ? { borderBottom: '2px solid #037dd6' }
                : { borderBottom: '2px solid transparent' }
            }
          >
            Wallet
          </Typography>
        </Box>

        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={10}
          onClick={() => setActiveLink('exploreWeb3')}
          style={{ cursor: 'pointer', width: 'max-content' }}
        >
          <Typography
            tag="i"
            className="fa fa-th"
            color={activeLink === 'exploreWeb3' ? COLORS.PRIMARY1 : COLORS.UI4}
          />
          <Typography
            boxProps={{ margin: 0, marginLeft: 4, padding: [2, 0] }}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'exploreWeb3' ? COLORS.PRIMARY1 : COLORS.UI4}
            fontWeight={activeLink === 'exploreWeb3' ? FONT_WEIGHT.BOLD : null}
            style={
              activeLink === 'exploreWeb3'
                ? { borderBottom: '2px solid #037dd6' }
                : { borderBottom: '2px solid transparent' }
            }
          >
            Explore Web3
          </Typography>
        </Box>

        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={10}
          onClick={() => setActiveLink('contacts')}
          style={{ cursor: 'pointer', width: 'max-content' }}
        >
          <Typography
            tag="i"
            className="fa fa-address-book"
            color={activeLink === 'contacts' ? COLORS.PRIMARY1 : COLORS.UI4}
          />
          <Typography
            boxProps={{ margin: 0, marginLeft: 4, padding: [2, 0] }}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'contacts' ? COLORS.PRIMARY1 : COLORS.UI4}
            fontWeight={activeLink === 'contacts' ? FONT_WEIGHT.BOLD : null}
            style={
              activeLink === 'contacts'
                ? { borderBottom: '2px solid #037dd6' }
                : { borderBottom: '2px solid transparent' }
            }
          >
            Contacts
          </Typography>
        </Box>
      </ul>
    </Box>
  );
};

DefaultStory.storyName = 'Default';

export const Regular = () => {
  const [activeLink, setActiveLink] = useState('wallet');
  return (
    <Box backgroundColor={COLORS.UI1} padding={8}>
      <ul>
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={10}
          onClick={() => setActiveLink('wallet')}
          style={{ cursor: 'pointer', width: 'max-content' }}
        >
          <Typography
            tag="i"
            className="fa fa-wallet"
            color={activeLink === 'wallet' ? COLORS.PRIMARY1 : COLORS.UI4}
          />
          <Typography
            boxProps={{ margin: 0, marginLeft: 4, padding: [2, 0] }}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'wallet' ? COLORS.PRIMARY1 : COLORS.UI4}
            style={
              activeLink === 'wallet'
                ? { borderBottom: '2px solid #037dd6' }
                : { borderBottom: '2px solid transparent' }
            }
          >
            Wallet
          </Typography>
        </Box>

        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={10}
          onClick={() => setActiveLink('exploreWeb3')}
          style={{ cursor: 'pointer', width: 'max-content' }}
        >
          <Typography
            tag="i"
            className="fa fa-th"
            color={activeLink === 'exploreWeb3' ? COLORS.PRIMARY1 : COLORS.UI4}
          />
          <Typography
            boxProps={{ margin: 0, marginLeft: 4, padding: [2, 0] }}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'exploreWeb3' ? COLORS.PRIMARY1 : COLORS.UI4}
            style={
              activeLink === 'exploreWeb3'
                ? { borderBottom: '2px solid #037dd6' }
                : { borderBottom: '2px solid transparent' }
            }
          >
            Explore Web3
          </Typography>
        </Box>

        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={10}
          onClick={() => setActiveLink('contacts')}
          style={{ cursor: 'pointer', width: 'max-content' }}
        >
          <Typography
            tag="i"
            className="fa fa-address-book"
            color={activeLink === 'contacts' ? COLORS.PRIMARY1 : COLORS.UI4}
          />
          <Typography
            boxProps={{ margin: 0, marginLeft: 4, padding: [2, 0] }}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'contacts' ? COLORS.PRIMARY1 : COLORS.UI4}
            style={
              activeLink === 'contacts'
                ? { borderBottom: '2px solid #037dd6' }
                : { borderBottom: '2px solid transparent' }
            }
          >
            Contacts
          </Typography>
        </Box>
      </ul>
    </Box>
  );
};

Regular.storyName = 'Regular';

export const Bold = () => {
  const [activeLink, setActiveLink] = useState('wallet');
  return (
    <Box backgroundColor={COLORS.UI1} padding={8}>
      <ul>
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={10}
          onClick={() => setActiveLink('wallet')}
          style={{ cursor: 'pointer', width: 'max-content' }}
        >
          <Typography
            tag="i"
            className="fa fa-wallet"
            color={activeLink === 'wallet' ? COLORS.PRIMARY1 : COLORS.UI4}
          />
          <Typography
            boxProps={{ margin: 0, marginLeft: 4, padding: [2, 0] }}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'wallet' ? COLORS.PRIMARY1 : COLORS.UI4}
            fontWeight={FONT_WEIGHT.BOLD}
            style={
              activeLink === 'wallet'
                ? { borderBottom: '2px solid #037dd6' }
                : { borderBottom: '2px solid transparent' }
            }
          >
            Wallet
          </Typography>
        </Box>

        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={10}
          onClick={() => setActiveLink('exploreWeb3')}
          style={{ cursor: 'pointer', width: 'max-content' }}
        >
          <Typography
            tag="i"
            className="fa fa-th"
            color={activeLink === 'exploreWeb3' ? COLORS.PRIMARY1 : COLORS.UI4}
          />
          <Typography
            boxProps={{ margin: 0, marginLeft: 4, padding: [2, 0] }}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'exploreWeb3' ? COLORS.PRIMARY1 : COLORS.UI4}
            fontWeight={FONT_WEIGHT.BOLD}
            style={
              activeLink === 'exploreWeb3'
                ? { borderBottom: '2px solid #037dd6' }
                : { borderBottom: '2px solid transparent' }
            }
          >
            Explore Web3
          </Typography>
        </Box>

        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          tag="li"
          marginBottom={10}
          onClick={() => setActiveLink('contacts')}
          style={{ cursor: 'pointer', width: 'max-content' }}
        >
          <Typography
            tag="i"
            className="fa fa-address-book"
            color={activeLink === 'contacts' ? COLORS.PRIMARY1 : COLORS.UI4}
          />
          <Typography
            boxProps={{ margin: 0, marginLeft: 4, padding: [2, 0] }}
            variant={TYPOGRAPHY.H6}
            color={activeLink === 'contacts' ? COLORS.PRIMARY1 : COLORS.UI4}
            fontWeight={FONT_WEIGHT.BOLD}
            style={
              activeLink === 'contacts'
                ? { borderBottom: '2px solid #037dd6' }
                : { borderBottom: '2px solid transparent' }
            }
          >
            Contacts
          </Typography>
        </Box>
      </ul>
    </Box>
  );
};

Bold.storyName = 'Bold';
