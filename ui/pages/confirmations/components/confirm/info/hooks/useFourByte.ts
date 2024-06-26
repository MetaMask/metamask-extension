import { useDispatch, useSelector } from 'react-redux';
import {
  getKnownMethodData,
  use4ByteResolutionSelector,
} from '../../../../../../selectors';
import { getContractMethodData } from '../../../../../../store/actions';
import { useEffect } from 'react';
import { FourByteResponse } from '../../../../../../../shared/modules/transaction-decode/types';

type KnownMethodData = {
  name: string;
  params: { type: string }[];
};

export const useFourByte = ({
  transactionData,
}: {
  transactionData: string;
}): FourByteResponse | undefined => {
  const dispatch = useDispatch();
  const is4ByteEnabled = useSelector(use4ByteResolutionSelector);

  useEffect(() => {
    if (!is4ByteEnabled || !transactionData) {
      return;
    }

    dispatch(getContractMethodData(transactionData));
  }, [dispatch, is4ByteEnabled, transactionData]);

  const knownMethodData = useSelector((state) =>
    getKnownMethodData(state, transactionData),
  ) as KnownMethodData | undefined;

  if (!knownMethodData) {
    return;
  }

  const { name: label, params } = knownMethodData;
  const types = params.map((param) => param.type);

  const name =
    label.charAt(0).toLowerCase() + label.slice(1).split(' ').join('');

  const signature = `${name}(${types.join(',')})`;

  return { label, name, params, signature };
};
