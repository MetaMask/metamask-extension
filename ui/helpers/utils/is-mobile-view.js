// Checks if viewport at invoke time fits mobile dimensions
// isMobileView :: () => Bool
const isMobileView = () =>
  window.matchMedia('screen and (max-width: $break-small)').matches;

export default isMobileView;
