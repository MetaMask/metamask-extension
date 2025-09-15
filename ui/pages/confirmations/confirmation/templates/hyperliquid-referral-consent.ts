import { ApprovalRequest } from '@metamask/approval-controller';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';

function getValues(
  pendingApproval: ApprovalRequest<Record<string, any>>,
  t: (key: string) => string,
  actions: {
    resolvePendingApproval: (id: string, value: {
      approved: boolean;
      allAccounts: boolean;
      selectedAddress: string;
    }) => void;
  },
) {
  return {
    content: [
      {
        element: 'Box',
        key: 'hyperliquid-referral-header',
        props: {
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          alignItems: AlignItems.center,
          paddingBottom: 4,
        },
        children: [
          {
            element: 'Typography',
            key: 'hyperliquid-referral-title',
            props: {
              variant: TypographyVariant.H4,
              fontWeight: FontWeight.Bold,
              paddingBottom: 4,
            },
            children: t('metaMaskXHyperliquid'),
          },
          {
            element: 'Text',
            key: 'hyperliquid-referral-subtitle',
            props: {
              variant: TextVariant.bodyMd,
              color: TextColor.textAlternative,
            },
            children: [
              t('saveOnTradesWithAMetaMaskReferralCode'),
              ' ',
              {
                element: 'a',
                key: 'hyperliquid-referral-learn-more-link',
                props: {
                  href: '',
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  style: {
                    color: 'var(--color-primary-default)',
                    cursor: 'pointer',
                  },
                },
                children: t('learnMoreUpperCase'),
              },
            ],
          },
        ],
      },
      {
        element: 'Box',
        key: 'hyperliquid-referral-content',
        props: {
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          justifyContent: JustifyContent.spaceBetween,
          height: BlockSize.Full,
        },
        children: [
          {
            element: 'Box',
            key: 'hyperliquid-referral-image',
            props: {
              paddingBottom: 4,
            },
            children: {
              element: 'img',
              key: 'hyperliquid-referral-visual',
              props: {
                src: './images/hyperliquid-referral.png',
                alt: 'Hyperliquid referral image',
                width: BlockSize.Full,
              },
            },
          },
          {
            element: 'Box',
            key: 'hyperliquid-referral-checkbox-container',
            props: {
              display: Display.Flex,
              alignItems: AlignItems.flexStart,
              padding: 3,
              backgroundColor: BackgroundColor.backgroundSection,
              borderRadius: BorderRadius.MD,
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
                    marginTop: 4,
                    marginRight: 6,
                    transform: 'scale(1.3)',
                    accentColor: 'var(--color-primary-default)',
                  },
                },
              },
              {
                element: 'Text',
                key: 'hyperliquid-referral-label',
                props: {
                  variant: TextVariant.bodySm,
                  color: TextColor.textAlternative,
                  marginLeft: 1,
                  style: {
                    cursor: 'pointer',
                  },
                  onClick: () => {
                    const checkbox = document.getElementById(
                      'hyperliquid-referral-consent',
                    );
                    if (checkbox) {
                      checkbox.click();
                    }
                  },
                },
                children: t('allowMetaMaskToAddAReferralCode'),
              },
            ],
          },
        ],
      },
    ],
    submitText: t('confirm'),
    onSubmit: () => {
      const checkbox = document.getElementById('hyperliquid-referral-consent');
      const isChecked = checkbox
        ? (checkbox as HTMLInputElement).checked || (checkbox as HTMLInputElement).ariaChecked === 'true'
        : true;
      actions.resolvePendingApproval(pendingApproval.id, {
        approved: isChecked,
        allAccounts: isChecked,
        selectedAddress: pendingApproval.requestData?.selectedAddress,
      });
    },
  };
}

const hyperliquidReferralConsent = {
  getValues,
};

export default hyperliquidReferralConsent;
