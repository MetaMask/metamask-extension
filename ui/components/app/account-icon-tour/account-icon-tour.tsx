import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ProductTour } from '../../multichain/product-tour-popover';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { clearProductTour } from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';

const options = {
  placement: 'bottom-start',
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [0, 8],
      },
    },
    {
      name: 'preventOverflow',
      options: {
        boundary: 'clippingParents',
        altBoundary: true,
      },
    },
  ],
};

type Props = {
  anchorElement: HTMLElement | null;
};

const accountIconTour = (state: MetaMaskReduxState) =>
  state.metamask.productTour === 'accountIcon';

export const AccountIconTour = (props: Props) => {
  const { anchorElement } = props;
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isVisible = useSelector(accountIconTour);

  const handleClose = useCallback(() => {
    dispatch(clearProductTour());
  }, [dispatch]);

  if (process.env.IN_TEST || !isVisible || !anchorElement) {
    return null;
  }

  return (
    <ProductTour
      anchorElement={anchorElement}
      title={t('newAccountIconTitle')}
      description={t('newAccountIconMessage', [
        <b key="0">{t('settings')}</b>,
        <b key="1">{t('general')}</b>,
        <b key="2">{t('accountIdenticon')}</b>,
      ])}
      arrowPosition="-4px"
      popperOptions={options}
      closeMenu={handleClose}
      onClick={handleClose}
    />
  );
};
