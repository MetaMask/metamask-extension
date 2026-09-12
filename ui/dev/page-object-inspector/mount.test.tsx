import { createRoot } from 'react-dom/client';
import { mountPageObjectInspector } from './mount';
import { INSPECTOR_ROOT_ATTRIBUTE } from './types';

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));

jest.mock('./inspector', () => ({
  PageObjectInspector: () => null,
}));

const mockedCreateRoot = jest.mocked(createRoot);

describe('mountPageObjectInspector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mockedCreateRoot.mockClear();
  });

  it('mounts a dedicated root on the document body', () => {
    mountPageObjectInspector();

    const container = document.getElementById('page-object-inspector-root');
    expect(container).not.toBeNull();
    expect(container?.hasAttribute(INSPECTOR_ROOT_ATTRIBUTE)).toBe(true);
    expect(mockedCreateRoot).toHaveBeenCalledWith(container);
    expect(mockedCreateRoot.mock.results[0]?.value.render).toHaveBeenCalled();
  });

  it('does not mount a second root when one already exists', () => {
    mountPageObjectInspector();
    mountPageObjectInspector();

    expect(
      document.querySelectorAll('#page-object-inspector-root'),
    ).toHaveLength(1);
    expect(mockedCreateRoot).toHaveBeenCalledTimes(1);
  });
});
