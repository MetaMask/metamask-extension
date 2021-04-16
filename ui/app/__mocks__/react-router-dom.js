const originalModule = jest.requireActual('react-router-dom');

module.exports = {
  ...originalModule,
  useHistory: jest.fn(),
};
