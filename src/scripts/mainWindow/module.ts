import { patchApplications } from "./patchApplications";
import { patchDocumentMethods } from "./patchDocumentMethods";
import { PopupWindowCache } from "./PopupWindowCache";
import { logInfo } from "./utils";

logInfo("module code running...");

window.addEventListener("beforeunload", (): void => {
  PopupWindowCache.instance.forEach((popupWindow: Window): void => {
    popupWindow.close();
  });
});

patchDocumentMethods();
patchApplications();
