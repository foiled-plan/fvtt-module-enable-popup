
import { patchApplications } from "./patchApplications";
import { PopupWindowCache } from "./PopupCache";
import { RenderContextManager } from "./RenderContextManager";
import { logInfo } from "./utils";

logInfo("module code running...");

// Monkeypatch createElement to ensure that the popup window is created with the correct context
const originalCreateElement = document.createElement;
document.createElement = function (tagName: string, options?: ElementCreationOptions): HTMLElement {
  const renderContext = RenderContextManager.instance.currentContext;
  const popupWindow = renderContext ? PopupWindowCache.instance.get(renderContext) : null;
  if (popupWindow) {
    return popupWindow.document.createElement(tagName, options);
  }
  return originalCreateElement.call(this, tagName, options);
};

window.addEventListener("beforeunload", (): void => {
  PopupWindowCache.instance.forEach((popupWindow: Window): void => {
    popupWindow.close();
  });
});

patchApplications();
