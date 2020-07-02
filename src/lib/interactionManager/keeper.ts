export class Keeper<IDT extends string | number | symbol, ThingT extends object> {
  private _store: {[id in IDT]?: ThingT} = {}

  find(id: IDT): ThingT {
    const thing = this._store[id]
    if (typeof thing === 'undefined') {
      throw new Error(
        this.constructor.name +
        ": " + id + " not found"
      )
    } else {
      // @ts-ignore
      return thing
    }
  }
}
