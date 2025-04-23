/**
 * A singleton class to manage the current popup click context.
 *
 * Applications that are popped-up will set this context to the click event whenever they are clicked.
 * This enables determining whether a click handler was called from a popup window or not.
 * Currenty used to open applications as popups _if_ they are triggered from a click within a popup.
 */
export class PopupClickContextManager {
  static #instance: PopupClickContextManager | null = null;

  public static get instance() {
    if (!this.#instance) {
      this.#instance = new PopupClickContextManager();
    }
    return this.#instance;
  }

  #clickContexts: Array<MouseEvent> = [];

  public setClickContext(clickContext: MouseEvent): void {
    this.#clickContexts.push(clickContext);
    setTimeout(() => {
      this.#clickContexts.pop();
    }, 0);
  }

  public get currentContext(): MouseEvent | undefined {
    return this.#clickContexts.at(-1);
  }
}
