export type StoredObjectMetadata = {
  key: string;
  mimeType: string;
  sizeBytes: number;
};

export interface StorageDriver {
  upload(
    key: string,
    body: Uint8Array,
    metadata: Pick<StoredObjectMetadata, "mimeType">,
  ): Promise<StoredObjectMetadata>;
  read(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
  metadata(key: string): Promise<StoredObjectMetadata>;
  health(): Promise<"ok" | "unavailable">;
}
