import React from "react";
import { useLocation } from "react-router-dom";
import { Text } from "../../components/component-library";

const ShieldCryptoSubscription = () => {
  const { state } = useLocation();

  return (
    <>
      <Text>state: {JSON.stringify(state)}</Text>
    </>
  );
};

export default ShieldCryptoSubscription;
