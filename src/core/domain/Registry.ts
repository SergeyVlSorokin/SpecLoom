export interface RegistryEntry {
  id: string;
  type: string;
  path: string;
  version: string;
}

export interface RegistryData {
  entries: RegistryEntry[];
}

export class Registry {
  constructor(private data: RegistryData) {}

  public get entries(): RegistryEntry[] {
    return this.data.entries;
  }

  public getEntry(id: string): RegistryEntry | undefined {
    return this.data.entries.find(e => e.id === id);
  }

  public addEntry(entry: RegistryEntry) {
    if (this.getEntry(entry.id)) {
      throw new Error(`Duplicate entry ID: ${entry.id}`);
    }
    this.data.entries.push(entry);
  }
}
