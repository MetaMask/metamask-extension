// Checks if viewport at invoke time fits mobile dimensions
// isMobileView :: () => Bool
const isMobileView = () =>
  window.matchMedia('screen and (max-width: 575px)').matches;

export default isMobileView;
