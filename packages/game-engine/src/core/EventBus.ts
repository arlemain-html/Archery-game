type EventHandler = (...args: any[]) => void;

export class EventBus {
  private listeners: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event
   */
  public on(event: string, callback: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from an event
   */
  public off(event: string, callback: EventHandler): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event with data
   */
  public emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      // Create a copy to avoid issues if listeners are removed during execution
      const callbacksCopy = [...callbacks];
      callbacksCopy.forEach((callback) => callback(...args));
    }
  }

  /**
   * Clear all listeners for an event or all events
   */
  public clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
