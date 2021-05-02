import { Dropbox } from 'dropbox'

export interface UploadProps {
  dropbox: Dropbox
  file: File
}

export function upload(props: UploadProps) {}
