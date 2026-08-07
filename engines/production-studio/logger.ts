export class ProductionLogger {
  constructor(private prefix = "WalkNWow") {}

  info(message: string, data?: unknown) {
    console.log(`[${this.prefix}] ${message}`, data ?? "");
  }

  error(message: string, error?: unknown) {
    console.error(`[${this.prefix}] ${message}`, error ?? "");
  }
}
