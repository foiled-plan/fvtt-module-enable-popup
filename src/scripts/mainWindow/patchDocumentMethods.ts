import { PopupWindowCache } from "./PopupWindowCache";
import { RenderContextManager } from "./RenderContextManager";

type DocumentMethodKeys = Exclude<
  {
    [K in keyof Document]: Document[K] extends (...args: any[]) => any
      ? K
      : never;
  }[keyof Document],
  undefined
>;

const originalMethods: Partial<{ [K in DocumentMethodKeys]: Document[K] }> = {};

function createRedirectedDocumentMethod<T extends DocumentMethodKeys>(
  methodName: T
): Document[T] {
  if (!originalMethods[methodName]) {
    originalMethods[methodName] = document[methodName];
  }

  return function (...args: any[]): any {
    const renderContext = RenderContextManager.instance.currentContext;
    const popupWindow = renderContext
      ? PopupWindowCache.instance.get(renderContext)
      : null;
    if (popupWindow) {
      // @ts-expect-error can't get this typing to work
      return popupWindow.document[methodName].apply(popupWindow.document, args);
    }
    // @ts-expect-error can't get this typing to work
    return originalMethods[methodName]!.apply(document, args);
  };
}

export function patchDocumentMethods(): void {
  document.createElement = createRedirectedDocumentMethod("createElement");
  document.getElementById = createRedirectedDocumentMethod("getElementById");
  document.querySelector = createRedirectedDocumentMethod("querySelector");
  document.querySelectorAll =
    createRedirectedDocumentMethod("querySelectorAll");
}
