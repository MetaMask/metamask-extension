import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';

function getValues(pendingApproval, t, actions, _history) {
  console.log('🚀 Hyperliquid referral consent template called!');
  return {
    content: [
      {
        element: 'Box',
        key: 'hyperliquid-referral-header',
        props: {
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          alignItems: AlignItems.center,
          paddingTop: 4,
          paddingBottom: 4,
        },
        children: [
          {
            element: 'Box',
            key: 'hyperliquid-referral-icon',
            props: {
              display: Display.Flex,
              alignItems: AlignItems.center,
              justifyContent: JustifyContent.center,
              paddingBottom: 4,
            },
            children: {
              element: 'Text',
              key: 'hyperliquid-referral-icon-text',
              props: {
                variant: TypographyVariant.H4,
                color: TextColor.primaryDefault,
              },
              children: '🦊 MetaMask',
            },
          },
          {
            element: 'Typography',
            key: 'hyperliquid-referral-title',
            props: {
              variant: TypographyVariant.H3,
              paddingBottom: 2,
            },
            children: 'MetaMask x Hyperliquid',
          },
          {
            element: 'Typography',
            key: 'hyperliquid-referral-subtitle',
            props: {
              variant: TypographyVariant.H6,
              color: TextColor.textAlternative,
              paddingBottom: 4,
            },
            children:
              'Save up to 4% on trades with a MetaMask referral code. Learn more.',
          },
        ],
      },
      {
        element: 'Box',
        key: 'hyperliquid-referral-content',
        props: {
          paddingTop: 4,
          paddingBottom: 4,
        },
        children: [
          {
            element: 'Box',
            key: 'hyperliquid-referral-image',
            props: {
              display: Display.Flex,
              justifyContent: JustifyContent.center,
              paddingBottom: 4,
            },
            children: {
              element: 'div',
              key: 'hyperliquid-referral-visual',
              props: {
                style: {
                  width: '200px',
                  height: '200px',
                  backgroundColor: 'var(--color-primary-default)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                },
              },
              children: [
                {
                  element: 'div',
                  key: 'hyperliquid-referral-circle-1',
                  props: {
                    style: {
                      width: '80px',
                      height: '80px',
                      backgroundColor: 'var(--color-warning-default)',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '30px',
                      left: '60px',
                    },
                  },
                },
                {
                  element: 'div',
                  key: 'hyperliquid-referral-circle-2',
                  props: {
                    style: {
                      width: '60px',
                      height: '60px',
                      backgroundColor: 'var(--color-success-default)',
                      borderRadius: '50%',
                      position: 'absolute',
                      bottom: '40px',
                      right: '40px',
                    },
                  },
                },
              ],
            },
          },
          {
            element: 'Box',
            key: 'hyperliquid-referral-checkbox-container',
            props: {
              display: Display.Flex,
              alignItems: AlignItems.flexStart,
              paddingTop: 4,
              paddingBottom: 4,
            },
            children: [
                            {
                element: 'input',
                key: 'hyperliquid-referral-checkbox',
                props: {
                  type: 'checkbox',
                  id: 'hyperliquid-referral-consent',
                  defaultChecked: true,
                  style: {
                    marginRight: '12px',
                    transform: 'scale(1.3)',
                    accentColor: 'var(--color-primary-default)',
                  },
                },
              },
              {
                element: 'Text',
                key: 'hyperliquid-referral-label',
                props: {
                  variant: TypographyVariant.H7,
                  marginLeft: 1,
                  style: {
                    cursor: 'pointer',
                  },
                  onClick: () => {
                    const checkbox = document.getElementById('hyperliquid-referral-consent');
                    if (checkbox) {
                      checkbox.click();
                    }
                  },
                },
                children:
                  'Allow MetaMask to add a referral code. This is permanent. The site offers discounts per their terms. MetaMask earns a fee.',
              },
            ],
          },
          {
            element: 'Box',
            key: 'hyperliquid-referral-info',
            props: {
              paddingTop: 2,
              paddingBottom: 2,
            },
            children: {
              element: 'Typography',
              props: {
                variant: TypographyVariant.H7,
                color: TextColor.textAlternative,
                style: {
                  fontSize: '12px',
                  fontStyle: 'italic',
                },
              },
              children:
                '• For the hyperliquid case, users will confirm using the code on the dapp side too.',
            },
          },
        ],
      },
    ],
    submitText: t('confirm'),
    cancelText: t('cancel'),
    onSubmit: () => {
      const checkbox = document.getElementById('hyperliquid-referral-consent');
      const isChecked = checkbox ? checkbox.checked || checkbox.ariaChecked === 'true' : true;

      actions.resolvePendingApproval(pendingApproval.id, {
        approved: isChecked,
        allAccounts: isChecked, // If approved, applies to all accounts
        selectedAddress: pendingApproval.requestData?.selectedAddress,
      });
    },
    onCancel: () => {
      actions.resolvePendingApproval(pendingApproval.id, {
        approved: false,
        allAccounts: false,
        selectedAddress: pendingApproval.requestData?.selectedAddress,
      });
    },
  };
}

const hyperliquidReferralConsent = {
  getValues,
};

export default hyperliquidReferralConsent;
