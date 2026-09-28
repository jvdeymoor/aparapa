// Freeze the width in CSS pixels during browser zoom: viewport percentages would
// grow as the user zooms out and cancel the requested visual reduction.
export function installWideLayoutSizing(element, viewport = window) {
  let physicalWidth = 0;
  const resize = () => {
    const width = viewport.innerWidth;
    const nextPhysicalWidth = width * (viewport.devicePixelRatio || 1);
    if (!physicalWidth || Math.abs(nextPhysicalWidth - physicalWidth) > 8) {
      element.style.setProperty('--wide-layout-width', `${width * .75}px`);
      element.ownerDocument?.documentElement.style.setProperty('--desktop-dialog-width', `${Math.max(600,width*.7)}px`);
      physicalWidth = nextPhysicalWidth;
    }
  };
  resize();
  viewport.addEventListener('resize', resize);
  return () => viewport.removeEventListener('resize', resize);
}
