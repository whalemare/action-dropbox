export interface Uploader {
  buffer: Buffer
  destination: string
}

export type StreamUploader = {
  onProgress?: (uploaded: number, total: number) => void

  /**
   * Size of small blob part
   *
   * Used in partition large file (ex. 100Mb) to small blobs (ex. 8Mb)
   *
   * Maximum: 8Mb
   *
   * @default 8Mb
   */
  partSizeBytes?: number
} & Uploader
