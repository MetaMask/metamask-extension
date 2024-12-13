import React from 'react';
import { AlignItems } from "../../../helpers/constants/design-system";
import { Display } from "../../../helpers/constants/design-system";
import { TextColor } from "../../../helpers/constants/design-system";
import { ButtonLinkSize, Text } from "../../../components/component-library";
import { ButtonLink } from "../../../components/component-library";
import { setWasTxDeclined } from "../../../ducks/bridge/actions";
import { useDispatch } from "react-redux";

export const BridgeTxDeclinedMessage = () => {
  const dispatch = useDispatch();

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
