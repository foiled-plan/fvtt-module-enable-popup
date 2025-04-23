
export function runTooltipScript() {
// set up proxies for global variables
const gameProxy = new Proxy(window.opener.game, {
    get(target, prop) {
      console.log(`Accessing property ${String(prop)} on game object`);
      if (prop === "tooltip") {
        return undefined;
      }
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });

  // Assign the proxy to the global game object
  Object.defineProperty(window, "game", {
    get() {
      return gameProxy;
    },
    configurable: true,
  });

  Object.defineProperty(window, "foundry", {
    get() {
      return window.opener.foundry;
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

  const tooltipManagerString =
    window.opener.foundry.helpers.interaction.TooltipManager.toString();
  const factory = eval("() =>" + tooltipManagerString);
  const TooltipManager = factory();
  // @ts-ignore
  const tooltipManager = new TooltipManager();
  tooltipManager.activateEventListeners();
}
