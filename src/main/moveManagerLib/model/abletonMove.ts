import path from 'path'

export const MOVE_USER_LIBRARY_PATH = path.posix.join('/', 'data', 'UserData', 'UserLibrary')
export const MOVE_SET_DIR = 'Sets'
export const MOVE_SET_DIR_PATH = path.posix.join(MOVE_USER_LIBRARY_PATH, MOVE_SET_DIR)

export const XATTR_LAST_MODIFIED_TIME = 'user.last-modified-time'
export const XATTR_LOCAL_CLOUD_STATE = 'user.local-cloud-state'
export const XATTR_SONG_COLOR = 'user.song-color'
export const XATTR_SONG_INDEX = 'user.song-index'
export const XATTR_WAS_EXTERNALLY_MODIFIED = 'user.was-externally-modified'
