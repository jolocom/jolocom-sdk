export class ServiceContainer {
  private readonly services: Record<string, any> = {}

  register(
    identifier: string,
    service: unknown,
    prefix?: string,
    redefine = false,
  ) {
    const normalizedIdentifier = ServiceContainer.normalizeIdentifier(
      identifier,
      prefix,
    )

    if (this.services.hasOwnProperty(normalizedIdentifier) && !redefine) {
      throw new Error(
        `Service registration failed. Service with name: '${normalizedIdentifier}' already registered.`,
      )
    }

    this.services[normalizedIdentifier] = service

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

  private static normalizeIdentifier(
    identifier: string,
    prefix?: string,
  ): string {
    return prefix
      ? `${prefix}.${identifier.toLowerCase()}`
      : identifier.toLowerCase()
  }
}
