import { addHexPrefix } from 'ethereumjs-util';
import { Interface, ParamType } from '@ethersproject/abi';
import { Hex, createProjectLogger } from '@metamask/utils';
import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataParam,
} from '../../../../../shared/types/transaction-decode';
import { getMethodFrom4Byte } from '../../../../../shared/lib/four-byte';

const log = createProjectLogger('four-byte');

export async function decodeTransactionDataWithFourByte(
  transactionData: string,
): Promise<DecodedTransactionDataMethod | undefined> {
  const fourBytePrefix = transactionData.slice(0, 10);

  const signature = (await getMethodFrom4Byte(fourBytePrefix)) as Hex;

  if (!signature) {
    return undefined;
  }

  const name = signature.split('(')[0];
  const inputs = parseSignature(signature);

  log('Generated inputs', inputs);

  const valueData = addHexPrefix(transactionData.slice(10));
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values = Interface.getAbiCoder().decode(inputs, valueData) as any[];

  const params = inputs.map((input, index) =>
    decodeParam(input, index, values),
  );

  return { name, params };
}

function decodeParam(
  input: ParamType,
  index: number,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any[],
): DecodedTransactionDataParam {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = values[index] as any[];
  const { type, name } = input;

  let children = input.components?.map((child, childIndex) =>
    decodeParam(child, childIndex, value),
  );

  if (type.endsWith('[]')) {
    const childType = type.slice(0, -2);

    children = value.map((_arrayItem, arrayIndex) => {
      const childName = `Item ${arrayIndex + 1}`;

      return decodeParam(
        { ...input, name: childName, type: childType } as ParamType,
        arrayIndex,
        value,
      );
    });
  }

  return {
    name,
    type,
    value,
    children,
  };
}

function parseSignature(signature: string): ParamType[] {
  let typeString = signature.slice(signature.indexOf('(') + 1, -1);
  const nested = [];

  while (typeString.includes('(')) {
    const nestedBrackets = findFirstNestedBrackets(typeString);

    if (!nestedBrackets) {
      break;
    }

    nested.push(nestedBrackets.value);

    typeString = `${typeString.slice(0, nestedBrackets.start)}${
      nested.length - 1
    }#${typeString.slice(nestedBrackets.end + 1)}`;
  }

  return createInput(typeString, nested);
}

function createInput(typeString: string, nested: string[]): ParamType[] {
  return typeString.split(',').map((value) => {
    const parts = value.split('#');

    const nestedIndex = parts.length > 1 ? parseInt(parts[0], 10) : undefined;
    const type = nestedIndex === undefined ? value : `tuple${parts[1] ?? ''}`;

    const components =
      nestedIndex === undefined
        ? undefined
        : createInput(nested[nestedIndex], nested);

    return {
      type,
      components,
    } as ParamType;
  });
}

function findFirstNestedBrackets(
  value: string,
): { start: number; end: number; value: string } | undefined {
  let start = -1;

  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') {
      start = i;
    } else if (value[i] === ')' && start !== -1) {
      return {
        start,
        end: i,
        value: value.slice(start + 1, i),
      };
    }
  }

  return undefined;
}
