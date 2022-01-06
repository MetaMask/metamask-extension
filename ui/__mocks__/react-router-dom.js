const originalModule = jest.requireActual('react-router-dom');

module.exports = {
  ...originalModule,
  useHistory: jest.fn(() => {
    return [];
  }),
  useLocation: jest.fn(() => {
    return {
      pathname: '/swaps/build-quote',
    };
  }),
};
