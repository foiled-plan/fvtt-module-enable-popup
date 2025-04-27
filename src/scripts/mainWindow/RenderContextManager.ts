import { MaybePromise } from "fvtt-types/utils";

/**
 * A singleton class to manage the current render context.
 *
 * popup-enabled classes will set this context to the current application id whenever they are rendering.
 * This should be used together with PopupCache singleton to determine if a given application is opened
 * in a popup or not during the rendering process.
 *
 * Actions that occur after the current render method resolves will not be able to determine
 * which context the rendering occurs in.
 */
export class RenderContextManager {
  static #instance: RenderContextManager | null = null;
  static get instance() {
    if (!this.#instance) {
      this.#instance = new RenderContextManager();
    }
    return this.#instance;
  }

  #renderContexts: Array<string> = [];

  async trackContext<T extends MaybePromise<any>>(
    context: string,
    callback: () => T
  ): Promise<T> {
    this.#renderContexts.push(context);
    try {
      return callback();
    } finally {
      setTimeout(() => this.#renderContexts.pop(), 50);
    }
  }

  get currentContext(): string | undefined {
    return this.#renderContexts.at(-1);
  }
}
