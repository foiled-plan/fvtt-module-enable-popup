export class PopupWindowCache extends Map<string, Window> {
  static #instance: PopupWindowCache | null = null;
  static get instance() {
    if (!this.#instance) {
      this.#instance = new PopupWindowCache();
    }
    return this.#instance;
  }

  /**
   * Returns the cached window object for the given key. The returned window is guaranteed to be open.
   */
  public override get(key: string) {
    const poppedOut = super.get(key);
    if (poppedOut && poppedOut.closed) {
      super.delete(key);
      return undefined;
    }
    return poppedOut;
  }
  /**
   * Returns true if the key exists in the cache and the window is open.
   */
  public override has(key: string) {
    return !!this.get(key);
  }
  /**
   * Sets the value for the key in the cache. If the window is closed, it will not be added to the cache.
   */
  public override set(key: string, value: Window) {
    if (!value.closed) {
      super.set(key, value);
    }
    return this;
  }
  /**
   * Executes the provided callback once for each key-value pair in the Map object, in insertion order.
   * Window objects are guaranteed to be open.
   */
  public override forEach(callbackfn: (value: Window, key: string, map: Map<string, Window>) => void, thisArg?: any): void {
    for (const [key, value] of this) {
      if (value.closed) {
        super.delete(key);
      } else {
        callbackfn.call(thisArg, value, key, this);
      }
    }
  }
}
