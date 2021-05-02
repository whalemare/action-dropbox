export interface Logger {
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(message: string, error?: Error): void
  error(message: string, error?: Error): void
}
