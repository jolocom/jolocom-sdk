export class ServiceContainer {
  private readonly services: Record<string, any> = {}

  register(identifier: string, plugin: any, redefine = false) {
    const normalizedIdentifier = ServiceContainer.normalizeIdentifier(identifier)

    if (this.services.hasOwnProperty(normalizedIdentifier) && !redefine) {
      throw new Error(
        `Service registration failed. Service with name: '${normalizedIdentifier}' already registered.`,
      )
    }

    this.services[normalizedIdentifier] = plugin

    return this
  }

  get<T>(identifier: string): T {
    const normalizedIdentifier = ServiceContainer.normalizeIdentifier(identifier)

    if (!this.services.hasOwnProperty(normalizedIdentifier)) {
      throw new Error(
        `Service with identifier: ${normalizedIdentifier} is not registered.`,
      )
    }

    return this.services[normalizedIdentifier] as T
  }

  private static normalizeIdentifier(identifier: string): string {
    return identifier.toLowerCase()
  }
}
