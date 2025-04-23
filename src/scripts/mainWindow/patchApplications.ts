import { AnyConstructor } from "fvtt-types/utils";
import { applyEnablePopupMiddleware, logError } from "./utils";

export function patchApplications() {
  const applicationsToPatch: AnyConstructor[] = [
    foundry.applications.api.DialogV2,
    foundry.applications.api.DocumentSheetV2,
    foundry.applications.apps.CombatTrackerConfig,
    foundry.applications.apps.CompendiumArtConfig,
    foundry.applications.apps.FilePicker,
    foundry.applications.apps.ImagePopout,
    foundry.applications.apps.PermissionConfig,
    foundry.applications.dice.RollResolver,
    foundry.applications.sheets.PrototypeTokenConfig,
    foundry.applications.sidebar.apps.ChatPopout,
    foundry.applications.sidebar.apps.FrameViewer,
    foundry.applications.settings.menus.UIConfig,
    foundry.applications.api.CategoryBrowser,
    foundry.applications.settings.menus.AVConfig,
    foundry.applications.apps.av.CameraPopout,
    foundry.applications.apps.av.CameraViews,
    foundry.applications.sidebar.apps.WorldConfig,
  ];
  applicationsToPatch.forEach((app) => {
    try {
      applyEnablePopupMiddleware(app);
    } catch (e) {
      logError(`Error applying middleware to ${app.name}:`, e);
    }
  });
}
