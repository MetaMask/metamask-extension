import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/jest/rendering';
import * as Actions from '../../store/actions';
import AddCollectible from '.';

const VALID_ADDRESS = '0x312BE6a98441F9F6e3F6246B13CA19701e0AC3B9';
const INVALID_ADDRESS = 'aoinsafasdfa';
const VALID_TOKENID = '1201';
const INVALID_TOKENID = 'abcde';

describe('AddCollectible', () => {
  const store = configureMockStore([])({
    metamask: { provider: { chainId: '0x1' } },
  });

  it('should enable the "Add" button when valid entries are input into both Address and TokenId fields', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <AddCollectible />,
      store,
    );
    expect(getByText('Add')).not.toBeEnabled();
    fireEvent.change(getByTestId('address'), {
      target: { value: VALID_ADDRESS },
    });
    fireEvent.change(getByTestId('token-id'), {
      target: { value: VALID_TOKENID },
    });
    expect(getByText('Add')).toBeEnabled();
  });

  it('should not enable the "Add" button when an invalid entry is input into one or both Address and TokenId fields', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <AddCollectible />,
      store,
    );
    expect(getByText('Add')).not.toBeEnabled();
    fireEvent.change(getByTestId('address'), {
      target: { value: INVALID_ADDRESS },
    });
    fireEvent.change(getByTestId('token-id'), {
      target: { value: VALID_TOKENID },
    });
    expect(getByText('Add')).not.toBeEnabled();
    fireEvent.change(getByTestId('address'), {
      target: { value: VALID_ADDRESS },
    });
    expect(getByText('Add')).toBeEnabled();
    fireEvent.change(getByTestId('token-id'), {
      target: { value: INVALID_TOKENID },
    });
    expect(getByText('Add')).not.toBeEnabled();
  });

  it('should call addCollectibleVerifyOwnership action with correct values (tokenId should not be in scientific notation)', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <AddCollectible />,
      store,
    );
    fireEvent.change(getByTestId('address'), {
      target: { value: VALID_ADDRESS },
    });
    const LARGE_TOKEN_ID = Number.MAX_SAFE_INTEGER + 1;
    fireEvent.change(getByTestId('token-id'), {
      target: { value: LARGE_TOKEN_ID },
    });
    const addCollectibleVerifyOwnershipSpy = jest.spyOn(
      Actions,
      'addCollectibleVerifyOwnership',
    );

    fireEvent.click(getByText('Add'));
    expect(addCollectibleVerifyOwnershipSpy).toHaveBeenCalledWith(
      '0x312BE6a98441F9F6e3F6246B13CA19701e0AC3B9',
      '9007199254740992',
    );
  });
});
