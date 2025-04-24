import { PopupClickContextManager } from "./PopupClickContextManager";
import { PopupWindowCache } from "./PopupWindowCache";
import { RenderContextManager } from "./RenderContextManager";
import {
  copyAttributes,
  copyElements,
  getPopupDimensions,
  logError,
  openPopup,
} from "./utils";
import { PopupPosition } from "./types";
import AppV2 = foundry.applications.api.ApplicationV2;
import { DeepPartial } from "fvtt-types/utils";

export function EnablePopupMixin<TBase extends typeof AppV2>(BaseClass: TBase) {
  function showPopupButton(this: EnablePopupMiddleware) {
    return !this.isPopup;
  }

  function showPopdownButton(this: EnablePopupMiddleware) {
    return this.isPopup;
  }

  function onPopupButtonClicked(event: PointerEvent): void {
    // we assume this function is called in the context of the class
    // that is using the mixin, so we need to cast it to the correct type

    // @ts-expect-error 'this' implicitly has type 'any' because it does not have a type annotation.ts(2683)
    const that = this as EnablePopupMiddleware;
    if (!(that instanceof EnablePopupMiddleware)) {
      logError("onPopupButtonClicked called on class without middleware", that);
      return;
    }
    event.preventDefault();
    const x = event.screenX;
    const y = event.screenY;
    const { width, height } = getPopupDimensions(
      that.id,
      that.options.position
    );
    that.popup({ left: x - width, top: y, width, height }, { window: {} });
  }

  function onPopdownButtonClicked(): void {
    // @ts-expect-error 'this' implicitly has type 'any' because it does not have a type annotation.ts(2683)
    const that = this as EnablePopupMiddleware;
    if (!(that instanceof EnablePopupMiddleware)) {
      logError(
        "onPopdownButtonClicked called on class without middleware",
        that
      );
      return;
    }
    that.popdown();
  }

  // @ts-expect-error A mixin class must have a constructor with a single rest parameter of type 'any[]'.ts(2545)
  // This seems to be a bug in TypeScript https://github.com/microsoft/TypeScript/issues/37142#issuecomment-1690288978
  class EnablePopupMiddleware extends BaseClass {
    static DEFAULT_OPTIONS: DeepPartial<AppV2.Configuration> = {
      window: {
        controls: [
          {
            icon: "fa-solid fa-expand",
            label: "ENABLEPOPUP.popup",
            action: "popup",
            visible: showPopupButton,
          },
          {
            icon: "fa-solid fa-compress",
            label: "ENABLEPOPUP.popdown",
            action: "popdown",
            visible: showPopdownButton,
          },
        ],
      },
      actions: {
        popup: onPopupButtonClicked,
        popdown: onPopdownButtonClicked,
      },
    };

    #closePopupCallback = () => this.close({ animate: false });

    public override async render(
      options?: DeepPartial<AppV2.RenderOptions> | boolean,
      _options?: DeepPartial<AppV2.RenderOptions>
    ): Promise<this> {
      let mergedOptions: DeepPartial<AppV2.RenderOptions> | undefined;
      if (typeof options === "object") {
        mergedOptions = options;
      } else if (typeof options === "boolean") {
        mergedOptions = Object.assign(_options ?? {}, { force: options });
      }
      
      const popupClickContext =
        PopupClickContextManager.instance.currentContext;
      if (
        popupClickContext &&
        RenderContextManager.instance.currentContext !== this.id &&
        this.rendered === false
      ) {
        // if render was called in response to a click event
        // in a popup window, we want to open as a popup too
        const x = popupClickContext.screenX;
        const y = popupClickContext.screenY;
        const { width, height } = getPopupDimensions(
          this.id,
          this.options.position
        );
        return this.popup(
          { left: x - width, top: y, width, height },
          mergedOptions
        );
      }
      return RenderContextManager.instance.trackContext(this.id, () =>
        super.render(mergedOptions)
      );
    }

    public override async close(
      options?: Parameters<AppV2["close"]>[0]
    ): Promise<this> {
      const popupWindow = PopupWindowCache.instance.get(this.id);
      if (popupWindow) {
        if (options?.closeKey) {
          // do not close the popup from "Esc" key on main window
          return this;
        }
        PopupWindowCache.instance.delete(this.id);
        popupWindow?.removeEventListener("unload", this.#closePopupCallback);
      }
      await super.close(options);
      popupWindow?.close();
      return this;
    }

    public override bringToFront() {
      const popupWindow = PopupWindowCache.instance.get(this.id);
      popupWindow?.focus();
      return super.bringToFront();
    }

    public async popup(
      { left, top, width, height }: PopupPosition,
      renderOptions: DeepPartial<AppV2.RenderOptions> = {}
    ): Promise<this> {
      const popupWindow = PopupWindowCache.instance.get(this.id);
      if (popupWindow) {
        popupWindow.focus();
        return this;
      }

      if (this.rendered) {
        await this.close();
      }

      const popup = await openPopup({
        id: this.id,
        top,
        left,
        width,
        height,
      });

      popup.document.title = this.title;

      copyAttributes(document.documentElement, popup.document.documentElement, [
        "lang",
        "class",
        "style",
      ]);
      copyAttributes(document.body, popup.document.body, ["class", "style"]);

      copyElements(document.head.querySelectorAll('style'), popup.document.head);

      // Use `capture: true` to ensure the click event is captured before any other handlers
      // ensuring that the click context is already set in any other click handler.
      popup.addEventListener(
        "click",
        (e) => PopupClickContextManager.instance.setClickContext(e),
        { capture: true }
      );
      popup.addEventListener("unload", this.#closePopupCallback);
      popup.addEventListener("unhandledrejection", (e) => {
        logError(`[${popup.name}] Unhandled rejection:`, e);
      });
      popup.addEventListener("error", (e) => {
        logError(`[${popup.name}] Unhandled error:"`, e);
      });

      PopupWindowCache.instance.set(this.id, popup);

      return this.render({ ...renderOptions, force: true });
    }

    public override async minimize() {
      if (this.isPopup) {
        // minimizing popup windows is not supported
        return;
      }
      return super.minimize();
    }

    public async popdown() {
      const popupWindow = PopupWindowCache.instance.get(this.id);
      if (!popupWindow) {
        return this;
      }
      window.focus();
      await this.close({ animate: false });

      // run in the next turn of the event loop so that the render is not run
      // While the PopupClickContext is set
      setTimeout(() => this.render({ force: true }), 0);
    }

    public get isPopup() {
      return PopupWindowCache.instance.has(this.id);
    }

    protected override _insertElement(
      element: Parameters<AppV2["_insertElement"]>[0]
    ): ReturnType<AppV2["_insertElement"]> {
      const popupWindow = PopupWindowCache.instance.get(this.id);
      if (popupWindow) {
        const existing = popupWindow.document.getElementById(element.id);
        if (existing) {
          existing.replaceWith(element);
        } else {
          popupWindow.document.body.append(element);
        }
        element.querySelector<HTMLElement>("[autofocus]")?.focus();
        return element;
      } else {
        return super._insertElement(element);
      }
    }
  }

  return EnablePopupMiddleware;
}
