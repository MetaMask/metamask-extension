import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { readInspectorSettings } from '../../../../dev/page-object-inspector/mode';
import { PageObjectInspectorSettings } from './page-object-inspector';

describe('PageObjectInspectorSettings', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the outline and hover toggles off by default', () => {
    const { getByTestId } = renderWithProvider(
      <PageObjectInspectorSettings />,
      mockStore,
    );

    expect(
      getByTestId('page-object-inspector-outline-toggle'),
    ).toBeInTheDocument();
    expect(
      getByTestId('page-object-inspector-hover-toggle'),
    ).toBeInTheDocument();
    expect(readInspectorSettings()).toStrictEqual({
      hover: false,
      outline: false,
    });
  });

  it('persists outline and hover independently', () => {
    const { getByTestId } = renderWithProvider(
      <PageObjectInspectorSettings />,
      mockStore,
    );

    fireEvent.click(getByTestId('page-object-inspector-outline-toggle'));
    expect(readInspectorSettings()).toStrictEqual({
      hover: false,
      outline: true,
    });

    fireEvent.click(getByTestId('page-object-inspector-hover-toggle'));
    expect(readInspectorSettings()).toStrictEqual({
      hover: true,
      outline: true,
    });
  });
});
