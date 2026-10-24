import * as designerModeCore from '.';

describe('designer-mode core barrel', () => {
  it('re-exports the public API', () => {
    expect(designerModeCore.DesignerModeCore).toBeDefined();
    expect(designerModeCore.RelayClient).toBeDefined();
    expect(designerModeCore.OverlayController).toBeDefined();
    expect(designerModeCore.PanelController).toBeDefined();
    expect(designerModeCore.ToggleController).toBeDefined();
    expect(designerModeCore.formatAgentPrompt).toBeDefined();
    expect(designerModeCore.formatForClipboard).toBeDefined();
    expect(designerModeCore.extractComputedStyles).toBeDefined();
    expect(designerModeCore.buildDomPath).toBeDefined();
    expect(designerModeCore.detectFramework).toBeDefined();
    expect(designerModeCore.createAdapter).toBeDefined();
  });
});
