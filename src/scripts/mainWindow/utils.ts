import { AnyConstructor } from "fvtt-types/utils";
import { EnablePopupMixin } from "./EnablePopupMixin";
import { PopupPosition } from "./types";

export function applyEnablePopupMiddleware(Class: AnyConstructor): void {
  const ParentClass = Object.getPrototypeOf(Class);
  const MixedIn = EnablePopupMixin(ParentClass);
  Object.setPrototypeOf(Class.prototype, MixedIn.prototype);
  Object.setPrototypeOf(Class, MixedIn);
}

export function getPopupDimensions(
  id: string,
  position: Partial<foundry.applications.api.ApplicationV2.Position>
): { width: number; height: number } {
  let { width, height } = position;
  if (typeof width === "number" && typeof height === "number") {
    return { width, height };
  }
  const boundingRect = document
    .querySelector(`#${id}`)
    ?.getBoundingClientRect();

  if (typeof width !== "number") {
    width = boundingRect?.width ?? 400;
  }
  if (typeof height !== "number") {
    height = boundingRect?.height ?? 600;
  }
  return {
    width,
    height,
  };
}

export function copyAttributes(
  source: HTMLElement,
  target: HTMLElement,
  attributeNamesToCopy: string[]
): void {
  attributeNamesToCopy.forEach((attr) => {
    source.attributes
    const value = source.getAttribute(attr);
    if (value) {
      target.setAttribute(attr, value);
    }
  });
}

export function copyElements(sourcesToCopy: NodeList, target: HTMLElement): void {
  const targetDocument = target.ownerDocument;
  if (!targetDocument) {
    logError("copyElements: targetDocument is null", target);
    return;
  }
  sourcesToCopy.forEach((sourceElement) => {
    if (!(sourceElement instanceof HTMLElement)) {
      logWarning(
        "copyElements: sourceElement is not an HTMLElement",
        sourceElement
      );
    } else {
      const adopted = targetDocument.importNode(sourceElement, true);
      target.appendChild(adopted);
    }
  });
}

/**
 * Open's a popup window, and waits for the DOM to be ready
 * before returning a reference to the window.
 */
export async function openPopup(
  options: PopupPosition & { id: string; maxWait?: number }
): Promise<Window> {
  const { id, left, top, width, height, maxWait = 10000 } = options;

  const popup = window.open(
    "/modules/fvtt-module-enable-popup/popup.html",
    id,
    `popup,innerWidth=${width},innerHeight=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
  );

  return new Promise<Window>((resolve, reject) => {
    try {
      if (!popup || popup.closed) {
        window.focus();
        ui.notifications?.warn(
          game.i18n?.localize("ENABLEPOPUP.unblockPopups") ??
            "Please allow popups for this site in your browser settings."
        );
        return reject(new Error(`[${id}] Popup couldn't be opened`));
      }
      const timeoutId = setTimeout(() => {
        reject(new Error(`[${id}] Popup loading timed out`));
      }, maxWait);
      popup.addEventListener(
        "DOMContentLoaded",
        () => {
          clearTimeout(timeoutId);
          console.log(
            `[${id}] Popup loaded successfully`,
          );
          resolve(popup);
        },
        { once: true }
      );
    } catch (e) {
      reject(e);
    }
  });
}

export function logInfo(message: string, ...args: unknown[]): void {
  console.log(`enable-popup | ${message}`, ...args);
}

export function logWarning(message: string, ...args: unknown[]): void {
  console.warn(`enable-popup | ${message}`, ...args);
}

export function logError(message: string, ...args: unknown[]): void {
  console.error(`enable-popup | ${message}`, ...args);
}

/**
 * A function to reevaluate a class in the current context.
 * This is useful for classes that are declared in the main window
 * and need to be used in the popup window in a way that we can't use
 * the main window's class directly.
 * 
 * @param Class - The class to reevaluate in the current context
 * @returns - The reevaluated class
 */
export function reevaluateClass<T extends AnyConstructor>(Class: T): T {
  const classStr = Class.toString();
  const factory = eval("() =>" + classStr);
  return factory() as T;
}
