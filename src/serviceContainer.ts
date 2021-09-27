export class ServiceContainer {
  private readonly plugins: Record<string, any> = {}

  register(identifier: string, plugin: any, redefine = false) {
    const normalizedIdentifier = ServiceContainer.normalizeIdentifier(identifier)

    if (this.plugins.hasOwnProperty(normalizedIdentifier) && !redefine) {
      throw new Error(
        `Service registration failed. Plugin with name: '${normalizedIdentifier}' already registered.`,
      )
    }

    this.plugins[normalizedIdentifier] = plugin

    return this
  }

  get<T>(identifier: string): T {
    const normalizedIdentifier = ServiceContainer.normalizeIdentifier(identifier)

    if (!this.plugins.hasOwnProperty(normalizedIdentifier)) {
      throw new Error(
        `Service with identifier: ${normalizedIdentifier} is not registered.`,
      )
    }

    return this.plugins[normalizedIdentifier] as T
  }

  private static normalizeIdentifier(identifier: string): string {
    return identifier.toLowerCase()
  }
}
