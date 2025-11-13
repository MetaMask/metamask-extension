import React from 'react';
import sinon from 'sinon';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import Lock from './lock.component';

const mockUseNavigate = jest.fn();

describe('Lock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('replaces history with default route when isUnlocked false', () => {
    const props = {
      isUnlocked: false,
      navigate: mockUseNavigate,
    };

    renderWithProvider(<Lock {...props} />);

    expect(mockUseNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('locks and pushes history with default route when isUnlocked true', async () => {
    const props = {
      isUnlocked: true,
      lockMetamask: sinon.stub(),
      navigate: mockUseNavigate,
    };

    props.lockMetamask.resolves();

    renderWithProvider(<Lock {...props} />);

    expect(await props.lockMetamask.calledOnce).toStrictEqual(true);
    expect(mockUseNavigate).toHaveBeenCalledWith('/');
  });
});
