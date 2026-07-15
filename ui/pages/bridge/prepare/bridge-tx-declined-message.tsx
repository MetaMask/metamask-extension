import React from 'react';
import {
  AlignItems,
  Display,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  ButtonLinkSize,
  Text,
  ButtonLink,
} from '../../../components/component-library';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';
import { useAppDispatch } from '../../../store/hooks';

export const BridgeTxDeclinedMessage = () => {
  const dispatch = useAppDispatch();

  return (
    <Text
      color={TextColor.textMuted}
      display={Display.Flex}
      alignItems={AlignItems.center}
      style={{ whiteSpace: 'nowrap' }}
    >
      You declined the transaction.
      <ButtonLink
        size={ButtonLinkSize.Sm}
        paddingLeft={1}
        onClick={() => {
          dispatch(setWasTxDeclined(false));
        }}
      >
        Get a new quote.
      </ButtonLink>
    </Text>
  );
};
