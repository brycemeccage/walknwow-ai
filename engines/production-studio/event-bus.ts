export type ProductionEvent =
  | "stage"
  | "progress"
  | "complete"
  | "error";

type Handler = (payload: unknown) => void;

export class ProductionEventBus {
  private handlers = new Map<ProductionEvent, Set<Handler>>();

  on(event: ProductionEvent, handler: Handler) {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);

    return () => {
      set.delete(handler);
    };
  }

  emit(event: ProductionEvent, payload: unknown) {
    for (const handler of this.handlers.get(event) ?? []) {
      handler(payload);
    }
  }
}
