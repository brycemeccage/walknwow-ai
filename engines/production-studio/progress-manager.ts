import type { ProductionState } from "./production-state";

export type ProgressListener = (state: ProductionState) => void;

export class ProgressManager {
  private listeners = new Set<ProgressListener>();
  private current: ProductionState;

  constructor(initial: ProductionState) {
    this.current = initial;
  }

  subscribe(listener: ProgressListener) {
    this.listeners.add(listener);
    listener(this.current);

    return () => {
      this.listeners.delete(listener);
    };
  }

  update(next: ProductionState) {
    this.current = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  getState() {
    return this.current;
  }
}
