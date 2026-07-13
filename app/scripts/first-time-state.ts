type FirstTimeState = {
  /** Initial configuration parameters */
  config: Record<string, unknown>;
};

const initialState: FirstTimeState = {
  config: {},
};
export default initialState;
