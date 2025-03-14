import React, { useEffect, useContext, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { isEqual } from 'lodash';
///: END:ONLY_INCLUDE_IF
import {
  addTransaction,
  removeSlide,
  updateSlides,
  upgradeHardwareAccount,
} from '../../../store/actions';
import { Carousel } from '..';
import {
  getSelectedAccountCachedBalance,
  getAppIsLoading,
  getSlides,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  getSelectedInternalAccount,
  getInternalAccounts,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import useBridging from '../../../hooks/bridge/useBridging';
///: END:ONLY_INCLUDE_IF
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import type { CarouselSlide } from '../../../../shared/constants/app-state';
import { Button } from '../../component-library';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';
import {
  FUND_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  CASH_SLIDE,
  ZERO_BALANCE,
} from './constants';
import { isSmartContractAddress } from '../../../helpers/utils/transactions.util';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

export const AccountOverviewLayout = ({
  children,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  const dispatch = useDispatch();
  const slides = useSelector(getSlides);
  const totalBalance = useSelector(getSelectedAccountCachedBalance);
  const isLoading = useSelector(getAppIsLoading);
  const trackEvent = useContext(MetaMetricsContext);
  const [hasRendered, setHasRendered] = useState(false);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);
  ///: END:ONLY_INCLUDE_IF

  const hasZeroBalance = totalBalance === ZERO_BALANCE;

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const { openBridgeExperience } = useBridging();
  ///: END:ONLY_INCLUDE_IF

  useEffect(() => {
    const fundSlide = {
      ...FUND_SLIDE,
      undismissable: hasZeroBalance,
    };

    const defaultSlides = [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      BRIDGE_SLIDE,
      ///: END:ONLY_INCLUDE_IF
      CARD_SLIDE,
      CASH_SLIDE,
    ];

    if (hasZeroBalance) {
      defaultSlides.unshift(fundSlide);
    } else {
      defaultSlides.splice(2, 0, fundSlide);
    }

    dispatch(updateSlides(defaultSlides));
  }, [hasZeroBalance]);

  const handleCarouselClick = (id: string) => {
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    if (id === 'bridge') {
      openBridgeExperience(
        'Carousel',
        defaultSwapsToken,
        location.pathname.includes('asset') ? '&token=native' : '',
      );
    }
    ///: END:ONLY_INCLUDE_IF

    trackEvent({
      event: MetaMetricsEventName.BannerSelect,
      category: MetaMetricsEventCategory.Banner,
      properties: {
        banner_name: id,
      },
    });
  };

  const handleRemoveSlide = (isLastSlide: boolean, id: string) => {
    if (id === 'fund' && hasZeroBalance) {
      return;
    }
    if (isLastSlide) {
      trackEvent({
        event: MetaMetricsEventName.BannerCloseAll,
        category: MetaMetricsEventCategory.Banner,
      });
    }
    dispatch(removeSlide(id));
  };

  const handleRenderSlides = useCallback(
    (renderedSlides: CarouselSlide[]) => {
      if (!hasRendered) {
        renderedSlides.forEach((slide) => {
          trackEvent({
            event: MetaMetricsEventName.BannerDisplay,
            category: MetaMetricsEventCategory.Banner,
            properties: {
              banner_name: slide.id,
            },
          });
        });
        setHasRendered(true);
      }
    },
    [hasRendered, trackEvent],
  );

  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>
      <Carousel
        slides={slides}
        isLoading={isLoading}
        onClick={handleCarouselClick}
        onClose={handleRemoveSlide}
        onRenderSlides={handleRenderSlides}
      />
      <UpgradeAccountButton />
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};

export function UpgradeAccountButton() {
  const [disabled, setDisabled] = useState(false);
  const GATOR_7702_ADDRESS = '0x6BC560a993dadF0C228084dcCC49a59CEd4999BA';
  const account = useSelector(getSelectedInternalAccount);
  const accounts = useSelector(getInternalAccounts);
  console.log('account', account);
  console.log('accounts', accounts);

  // get bytecode at account.address

  const handleUpgradeAccount = useCallback(async () => {
    console.log('handleUpgradeAccount');
    const isSmartContract = await isSmartContractAddress(account.address);
    console.log('isSmartContract', isSmartContract);
    const spender = accounts[0].address as `0x${string}`;
    const signature = await upgradeHardwareAccount({
      contractAddress: GATOR_7702_ADDRESS,
    });
    console.log('signature', signature);
    const parsed = JSON.parse(signature) as {
      chainId: number;
      contractAddress: `0x${string}`;
      nonce: number;
      r: `0x${string}`;
      s: `0x${string}`;
      yParity: number;
    };
    console.log('parsed', parsed);
    console.log('submitting tx:', {
      from: spender,
      to: account.address,
      value: '0x0',
      authorizationList: [
        {
          // convert to Hex string format
          chainId: `0x${parsed.chainId.toString(16)}`,
          address: parsed.contractAddress,
          nonce: `0x${parsed.nonce.toString(16)}`,
          r: parsed.r,
          s: parsed.s,
          yParity: `0x${parsed.yParity.toString(16)}`,
        },
      ],
    });
    const txMeta = await addTransaction(
      {
        type: '0x4',
        // from: spender,
        from: account.address,
        to: account.address,
        value: '0x0',
        authorizationList: [
          {
            // convert to Hex string format
            chainId: `0x${parsed.chainId.toString(16)}`,
            address: parsed.contractAddress,
            nonce: `0x${parsed.nonce.toString(16)}`,
            r: parsed.r,
            s: parsed.s,
            yParity: `0x${parsed.yParity.toString(16)}`,
          },
        ],
      },
      {
        requireApproval: true,
      },
    );
    console.log('txMeta', txMeta);
  }, [account, accounts]);

  if (account.metadata.keyring.type !== 'Mock Hardware') {
    return null;
  }

  return (
    <Button disabled={disabled} onClick={handleUpgradeAccount}>
      {disabled ? 'Upgraded' : 'Upgrade Account'}
    </Button>
  );
}
