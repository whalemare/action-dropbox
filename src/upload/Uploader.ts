export interface Uploader {
  /**
   * Upload file
   *
   * @returns id of file on server
   */
  upload(args: UploadArgs): Promise<string>
}

export interface UploadArgs {
  /**
   * Path to local file for uploading
   */
  file: string

  /**
   * Destination file path
   * @default file
   */
  destination?: string
}
