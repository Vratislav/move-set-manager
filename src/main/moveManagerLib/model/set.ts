export type MoveSetOnDevice = {
  id: string
  name: string
  color: number
  index: number
}

export type MoveSetInPage = {
  id: string
  alias?: string
  color: number
  index: number
}

export type MoveSetMetadata = MoveSetOnDevice & {
  lastModifiedTime: string
  localCloudState: string
  wasExternallyModified: boolean
}

export type MoveSet = {
  path: string
  meta: MoveSetMetadata
}

export type ManagerSetMetadata = {
  moveDeviceId: string
}

export type CompleteSetMetadata = {
  setId: string
  meta: MoveSetMetadata
  managerMeta: ManagerSetMetadata
}

export type SetWithCompleteMetadata = MoveSet & {
  managerMeta: ManagerSetMetadata
}
