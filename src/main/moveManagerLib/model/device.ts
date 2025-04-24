export type MoveDevice = {
  id: string
  name: string
  currentPageId: string
}

export type MoveDevices = {
  [id: string]: MoveDevice
}
