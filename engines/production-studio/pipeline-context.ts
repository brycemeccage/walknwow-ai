import type { ProductionInput } from "./integration-types";
import type { ProductionState } from "./production-state";
import { createInitialProductionState } from "./production-state";

export class ProductionContext {
  readonly input: ProductionInput;
  state: ProductionState;
  data = new Map<string, unknown>();

  constructor(input: ProductionInput) {
    this.input = input;
    this.state = createInitialProductionState();
  }

  set<T>(key: string, value: T) {
    this.data.set(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }
}
