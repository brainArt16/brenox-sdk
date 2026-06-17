type Listener<T> = (event: T) => void;

export class TypedEmitter<EventMap extends object> {
  private readonly listeners = new Map<
    keyof EventMap,
    Set<Listener<EventMap[keyof EventMap]>>
  >();

  on<K extends keyof EventMap>(
    type: K,
    listener: Listener<EventMap[K]>,
  ): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set as Set<Listener<EventMap[keyof EventMap]>>);
    }
    set.add(listener as Listener<EventMap[keyof EventMap]>);

    return () => {
      this.off(type, listener);
    };
  }

  off<K extends keyof EventMap>(
    type: K,
    listener: Listener<EventMap[K]>,
  ): void {
    this.listeners.get(type)?.delete(
      listener as Listener<EventMap[keyof EventMap]>,
    );
  }

  emit<K extends keyof EventMap>(type: K, event: EventMap[K]): void {
    const set = this.listeners.get(type);
    if (!set) {
      return;
    }
    for (const listener of set) {
      listener(event);
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
