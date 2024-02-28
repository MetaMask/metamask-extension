import { useModalProps } from './useModalProps';

const MOCK_PROPS = {
  test: 'test',
};
const MOCK_MM_STATE = {
  appState: {
    modal: {
      modalState: {
        props: MOCK_PROPS,
      },
    },
  },
};

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(MOCK_MM_STATE),
  useDispatch: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  hideModal: jest.fn(),
}));

describe('useModalProps', () => {
  it('should return modal props and hideModal function', () => {
    const { props, hideModal } = useModalProps();

    expect(props).toStrictEqual(MOCK_PROPS);
    expect(hideModal).toStrictEqual(expect.any(Function));
  });
});
