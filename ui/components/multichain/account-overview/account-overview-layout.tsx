import React, { useEffect, useContext, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { isEqual } from 'lodash';
///: END:ONLY_INCLUDE_IF
import {
  createRootDelegation,
  DelegationStruct,
  getDeleGatorEnvironment,
  SIGNABLE_DELEGATION_TYPED_DATA,
} from '@metamask-private/delegator-core-viem';
import { type Address } from 'viem';
import { sepolia } from 'viem/chains';
import {
  addTransaction,
  getNextNonce,
  newUnsignedTypedMessage,
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
import { isSmartContractAddress } from '../../../helpers/utils/transactions.util';
import {
  getStorageItem,
  setStorageItem,
} from '../../../../shared/lib/storage-helpers';
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
import { Json } from '@metamask/utils';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';

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

type Allowance = {
  delegation: DelegationStruct;
};

export function UpgradeAccountButton() {
  const [upgraded, setUpgraded] = useState(false);
  const [allowance, setAllowance] = useState<Allowance | null>(null);
  // sepolia
  const GATOR_7702_ADDRESS = '0xDC1C96531101926581CB1201338d698C072069B7';
  const account = useSelector(getSelectedInternalAccount);
  const accounts = useSelector(getInternalAccounts);
  const spender = accounts[0].address as `0x${string}`;

  console.debug('account', account);
  console.debug('accounts', accounts);
  console.debug('spender', spender);

  useEffect(() => {
    const checkAllowance = async () => {
      const allowances: Allowance[] =
        (await getStorageItem('vault-allowances')) ?? [];
      const _allowance = allowances.find(({ delegation }) => {
        const from = delegation.delegator;
        const to = delegation.delegate;
        return (
          from.toLowerCase() === account.address.toLowerCase() &&
          to.toLowerCase() === spender.toLowerCase()
        );
      });
      setAllowance(_allowance ?? null);
    };
    const checkIfUpgraded = async () => {
      const isSmartContract = await isSmartContractAddress(account.address);
      console.log('isSmartContract', isSmartContract);
      setUpgraded(isSmartContract);
      if (isSmartContract) {
        await checkAllowance();
      }
    };
    checkIfUpgraded().catch((err) => {
      console.error(err);
    });
  }, [account.address, spender]);

  const handleUpgradeAccount = useCallback(async () => {
    console.log('handleUpgradeAccount');
    // const spender = accounts[0].address as `0x${string}`;
    const txMeta = await addTransaction(
      {
        type: '0x4',
        from: account.address,
        to: account.address,
        value: '0x0',
        gas: '0xc3b0',
        authorizationList: [
          {
            // chainId: toHex(0),
            address: GATOR_7702_ADDRESS,
          },
        ],
      },
      {
        requireApproval: true,
      },
    );
    console.log('txMeta', txMeta);
  }, [account]);

  const handleEnableAllowance = useCallback(async () => {
    console.log('handleEnableAllowance');
    const delegation = createRootDelegation(
      spender,
      account.address as Address,
      [],
    );

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ];

    const parsedDelegation = {
      ...delegation,
      salt: delegation.salt.toString(),
    };

    const typedDataObj = {
      types: { EIP712Domain, ...SIGNABLE_DELEGATION_TYPED_DATA },
      primaryType: 'Delegation',
      domain: {
        name: 'DelegationManager',
        version: '1',
        chainId: String(sepolia.id),
        verifyingContract: getDeleGatorEnvironment(sepolia.id)
          .DelegationManager,
      },
      message: parsedDelegation,
    };

    const signature = await newUnsignedTypedMessage({
      messageParams: {
        origin: ORIGIN_METAMASK,
        from: account.address,
        version: SignTypedDataVersion.V4,
        data: JSON.stringify(typedDataObj),
      },
      request: {
        origin: ORIGIN_METAMASK,
        params: [],
        networkClientId: sepolia.name.toLowerCase(),
      },
      version: SignTypedDataVersion.V4,
    });

    await setStorageItem('vault-allowances', [
      ...((await getStorageItem('vault-allowances')) ?? []),
      {
        delegation: {
          ...parsedDelegation,
          signature,
        },
      },
    ]);
  }, [account.address, spender]);

  if (account.metadata.keyring.type !== 'Mock Hardware') {
    return null;
  }

  if (upgraded && !allowance) {
    return <Button onClick={handleEnableAllowance}>Enable Allowance</Button>;
  }

  return (
    <Button
      disabled={upgraded && Boolean(allowance)}
      onClick={handleUpgradeAccount}
    >
      {upgraded && Boolean(allowance) ? 'Allowance Enabled' : 'Upgrade Account'}
    </Button>
  );
}
