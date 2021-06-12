import React from 'react';
import { action } from '@storybook/addon-actions';
import { text, boolean } from '@storybook/addon-knobs';
import { Format } from '@truffle/codec';
import EthTxParams from '.';
import decodings from './decodings';

export default {
  title: 'Eth Tx Params',
  component: EthTxParams,
};

export const primaryType = () => {
  const decoding = decodings[0];
  const data = deserializeCalldataDecoding(decoding);
  
  return (
    <EthTxParams
      decoding = {data}
    >
    </EthTxParams>
  );
};

primaryType.storyName = 'Airswap tx';

export const secondaryType = () => {
  const decoding = decodings[1];
  const data = deserializeCalldataDecoding(decoding);
  
  return (
    <EthTxParams
      decoding = {data}
    >
    </EthTxParams>
  );
}

secondaryType.storyName = 'MolochDao Rage quit';

export const tertiaryType = () => {
  const decoding = decodings[2];
  const data = deserializeCalldataDecoding(decoding);
  
  return (
    <EthTxParams
      decoding = {data}
    >
    </EthTxParams>
  );
}

tertiaryType.storyName = 'Polygon deposit';

export const fourthType = () => {
  const decoding = decodings[3];
  const data = deserializeCalldataDecoding(decoding);
  
  return (
    <EthTxParams
      decoding = {data}
    >
    </EthTxParams>
  );
}

fourthType.storyName = 'Uniswap v3 swap';

function deserializeCalldataDecoding(decoding) {
  switch (decoding.kind) {
    case "function": {
      return {
        ...decoding,
        class: Codec.Format.Utils.Serial.deserializeType(decoding.class),
        arguments: decoding.arguments.map(({ name, value }) => ({
          name,
          value: Codec.Format.Utils.Serial.deserializeResult(value)
        }))
      };
    }
    case "constructor": {
      return {
        ...decoding,
        class: Codec.Format.Utils.Serial.deserializeType(decoding.class),
        arguments: decoding.arguments.map(({ name, value }) => ({
          name,
          value: Codec.Format.Utils.Serial.deserializeResult(value)
        }))
      };
    }
    case "message": {
      return {
        ...decoding,
        class: Codec.Format.Utils.Serial.deserializeType(decoding.class)
      };
    }
    case "unknown": {
      return decoding;
    }
    case "create": {
      return decoding;
    }
  }
}
  