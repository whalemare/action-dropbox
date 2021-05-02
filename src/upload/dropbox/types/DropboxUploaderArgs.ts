import { Logger } from '../../../utils/Logger'

export interface DropboxUploaderArgs {
  accessToken: string

  /**
   * @default console logger
   */
  logger?: Logger
}
