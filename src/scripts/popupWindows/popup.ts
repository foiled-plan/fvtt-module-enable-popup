import { reevaluateClass } from "../mainWindow/utils";

if (window.opener) {
  //----------------------------------------------------------------------------
  //  TooltipManager - recreate the tooltip manager in the child window
  //----------------------------------------------------------------------------
  const tooltipEl = document.createElement("aside");
  tooltipEl.id = "tooltip";
  tooltipEl.setAttribute("role", "tooltip");
  tooltipEl.setAttribute("popover", "manual");
  document.body.appendChild(tooltipEl);
  const parentFoundry = window.opener.foundry as typeof foundry;

  // set up proxies for global variables
  const gameProxy = new Proxy(window.opener.game, {
    get(target, prop) {
      if (prop === "tooltip") {
        // The TooltipManager class is a singleton with a check expecting
        // `game.tooltip` not to be defined when instatiated.
        // This allows us to create a new instance in this child window.
        return undefined;
      }
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });

  // Forward various global objects accesses to the main window needed for the TooltipManager
  Object.defineProperty(window, "game", {
    get() {
      return gameProxy;
    },
    configurable: true,
  });

  Object.defineProperty(window, "foundry", {
    get() {
      return parentFoundry;
    },
    configurable: true,
  });

  Object.defineProperty(window, "Math", {
    get() {
      return window.opener.Math;
    },
    configurable: true,
  });

  Object.defineProperty(window, "Tour", {
    get() {
      return {};
    },
    configurable: true,
  });

  const TooltipManager = reevaluateClass(
    // @ts-expect-error not typed
    parentFoundry.helpers.interaction.TooltipManager
  );
  const tooltipManager = new TooltipManager();
  tooltipManager.activateEventListeners();

  //----------------------------------------------------------------------------
  //  Custom HTML elements - re-define them in the child window
  //----------------------------------------------------------------------------
  const AbstractFormInputElement = reevaluateClass(
    parentFoundry.applications.elements.AbstractFormInputElement
  );
  Object.defineProperty(window, AbstractFormInputElement.name, {
    value: AbstractFormInputElement,
    configurable: false,
  });
  const AbstractMultiSelectElement = reevaluateClass(
    parentFoundry.applications.elements.AbstractMultiSelectElement
  );
  Object.defineProperty(window, AbstractMultiSelectElement.name, {
    value: AbstractMultiSelectElement,
    configurable: false,
  });

  const parentElements = parentFoundry.applications.elements;

  const customHtmlElements = [
    parentElements.HTMLColorPickerElement,
    parentElements.HTMLCodeMirrorElement,
    parentElements.HTMLDocumentEmbedElement,
    parentElements.HTMLDocumentTagsElement,
    parentElements.HTMLEnrichedContentElement,
    parentElements.HTMLFilePickerElement,
    parentElements.HTMLHueSelectorSlider,
    parentElements.HTMLMultiCheckboxElement,
    parentElements.HTMLMultiSelectElement,
    parentElements.HTMLProseMirrorElement,
    parentElements.HTMLRangePickerElement,
    // @ts-expect-error not typed
    parentElements.HTMLSecretBlockElement,
    parentElements.HTMLStringTagsElement,
  ] as const;

  customHtmlElements.forEach((element) => {
    const ReevaluatedCustomElement = reevaluateClass(element);
    window.customElements.define(
      ReevaluatedCustomElement.tagName,
      ReevaluatedCustomElement
    );
  });
} else {
  console.error("This script should only be run in a child window.");
}
