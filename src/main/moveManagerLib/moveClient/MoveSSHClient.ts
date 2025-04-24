import { NodeSSH } from 'node-ssh'
import { MoveSetMetadata, MoveSet } from '../model/set'
import path from 'path'
import { FileEntryWithStats, SFTPWrapper } from 'ssh2'
import {
  MOVE_SET_DIR,
  MOVE_SET_DIR_PATH,
  MOVE_USER_LIBRARY_PATH,
  XATTR_LAST_MODIFIED_TIME,
  XATTR_LOCAL_CLOUD_STATE,
  XATTR_SONG_COLOR,
  XATTR_SONG_INDEX,
  XATTR_WAS_EXTERNALLY_MODIFIED
} from '../model/abletonMove'
import {
  copyRecursiveFromRemote,
  getDirectoryListing,
  getExtendedAttributes,
  setExtendedAttribute,
  copyRecursiveToRemote,
  renameRemoteDirectoryOrFile
} from './sshUtils'
import { assert } from 'console'
export interface IMoveSSHClient {
  connect(): Promise<void>
  disconnect(): Promise<void>
  listSets(): Promise<MoveSet[]>
  downloadSet(setId: string, targetDir: string): Promise<MoveSet>
  uploadSet(set: MoveSet): Promise<MoveSet>
  deleteSet(setId: string): Promise<void>
  getMACAddress(): Promise<string | null>
}

export type SSHConnectionOpts = {
  host?: string
  port: number
  privKeyPath: string
  privKeyPassphrase?: string
  username?: string
}

export class MoveSSHClient implements IMoveSSHClient {
  private readonly connectionOpts: SSHConnectionOpts
  private readonly ssh: NodeSSH
  private sftp: SFTPWrapper | undefined
  constructor(connectionOpts: SSHConnectionOpts) {
    this.connectionOpts = connectionOpts
    if (!this.connectionOpts.username) {
      this.connectionOpts.username = 'ableton'
    }
    this.ssh = new NodeSSH()
  }
  async connect(): Promise<void> {
    await this.ssh.connect({
      host: this.connectionOpts.host,
      port: this.connectionOpts.port,
      privateKeyPath: this.connectionOpts.privKeyPath,
      passphrase: this.connectionOpts.privKeyPassphrase,
      username: this.connectionOpts.username
    })
    this.sftp = await this.ssh.requestSFTP()
  }
  async disconnect(): Promise<void> {
    if (this.ssh.isConnected()) {
      this.ssh.dispose()
    }
  }

  private async getSetMetadata(setId: string): Promise<MoveSetMetadata> {
    const setDirPath = path.join(MOVE_SET_DIR_PATH, setId)
    //console.log(`Getting attributes for ${setDirPath}`);
    const attributes = await this.getExtendedAttributes(setDirPath)
    const setDirContents = await this.getDirectoryListing(setDirPath)
    // get all directories in the set dir
    const setDirs = setDirContents.filter((stat) => stat.attrs.isDirectory())
    assert(setDirs.length === 1, `Expected 1 directory in ${setDirPath}`)
    const insideDir = setDirs[0]
    const setName = insideDir.filename
    const metaData: MoveSetMetadata = {
      id: setId,
      name: setName,
      index: parseInt(attributes[XATTR_SONG_INDEX]),
      color: parseInt(attributes[XATTR_SONG_COLOR]),
      localCloudState: attributes[XATTR_LOCAL_CLOUD_STATE],
      lastModifiedTime: attributes[XATTR_LAST_MODIFIED_TIME],
      wasExternallyModified: attributes[XATTR_WAS_EXTERNALLY_MODIFIED] === 'true'
    }
    return metaData
  }

  async listSets(): Promise<MoveSet[]> {
    const setsRootDir = path.join(MOVE_USER_LIBRARY_PATH, MOVE_SET_DIR)
    const setsInDirStats = await this.getDirectoryListing(setsRootDir)
    const setDirStats = setsInDirStats.filter((stat) => stat.attrs.isDirectory())

    const sets: MoveSet[] = [] // Initialize empty array to store results
    let setsCount = 0
    for (const setDirStat of setDirStats) {
      const setDirPath = path.join(setsRootDir, setDirStat.filename)
      const metadata = await this.getSetMetadata(setDirStat.filename)
      const set: MoveSet = {
        path: setDirPath,
        meta: metadata
      }
      sets.push(set)
    }

    return sets // Return the populated array (or empty if no sets found/processed)
  }

  private async getDirectoryListing(dir: string): Promise<FileEntryWithStats[]> {
    if (!this.sftp) {
      throw new Error('SFTP client not initialized')
    }
    return getDirectoryListing(this.sftp, dir)
  }

  private async getExtendedAttributes(path: string): Promise<{ [key: string]: string }> {
    return getExtendedAttributes(this.ssh, path)
  }

  private async setExtendedAttribute(path: string, key: string, value: string): Promise<void> {
    return setExtendedAttribute(this.ssh, path, key, value)
  }

  private async copyRecursiveFromRemote(
    localBaseDir: string,
    remoteFileOrDir: string
  ): Promise<void> {
    if (!this.sftp) {
      throw new Error('SFTP client not initialized')
    }
    return copyRecursiveFromRemote(this.sftp, localBaseDir, remoteFileOrDir)
  }

  private async copyRecursiveToRemote(
    localFileOrDir: string,
    remoteBaseDir: string
  ): Promise<void> {
    if (!this.sftp) {
      throw new Error('SFTP client not initialized')
    }
    return copyRecursiveToRemote(this.sftp, localFileOrDir, remoteBaseDir)
  }

  private async renameRemoteDirectoryOrFile(oldPath: string, newPath: string): Promise<void> {
    if (!this.sftp) {
      throw new Error('SFTP client not initialized')
    }
    return renameRemoteDirectoryOrFile(this.sftp, oldPath, newPath)
  }

  async downloadSet(setId: string, targetDir: string): Promise<MoveSet> {
    if (!this.sftp) {
      throw new Error('SFTP client not initialized')
    }
    const metadata = await this.getSetMetadata(setId)
    const remoteSetDir = path.join(MOVE_SET_DIR_PATH, setId)

    //console.log(`Downloading set from ${remoteSetDir} to ${targetDir}`);
    await this.copyRecursiveFromRemote(targetDir, remoteSetDir)

    // The local path will be the target directory plus the set ID directory
    const localSetPath = path.join(targetDir, setId)

    return {
      path: localSetPath, // Update the path to the local download location
      meta: metadata
    }
  }
  async uploadSet(set: MoveSet): Promise<MoveSet> {
    if (!this.sftp) {
      throw new Error('SFTP client not initialized')
    }

    if (set.meta.index > 31 || set.meta.index < 0) {
      throw new Error(`Index ${set.meta.index} is out of range`)
    }

    if (set.meta.color < 0 || set.meta.color > 26) {
      throw new Error(`Color ${set.meta.color} is out of range`)
    }

    const name = set.meta.name.trim()
    if (name.length > 32) {
      throw new Error(`Name ${name} is too long`)
    }
    if (name.length === 0) {
      throw new Error(`Name ${name} is empty`)
    }
    if (name.includes('/')) {
      throw new Error(`Name ${name} contains a slash`)
    }

    const remoteSetDirParent = MOVE_SET_DIR_PATH // e.g., /Users/ableton/Move/Sets
    const localSetPath = set.path // e.g., /local/tmp/download/set_id
    const setId = set.meta.id // e.g., set_id
    const remoteSetIdDirPath = path.join(remoteSetDirParent, setId) // e.g., /Users/ableton/Move/Sets/set_id

    // 1. Copy set recursive to remote
    // This will copy the contents of localSetPath into remoteSetIdDirPath
    // e.g., copy /local/tmp/download/set_id/* -> /Users/ableton/Move/Sets/set_id/
    await this.copyRecursiveToRemote(localSetPath, remoteSetDirParent)

    // 2. Rename the internal "_set" directory to the actual song name.
    const remoteInternalSetPath = path.join(remoteSetIdDirPath, '_set') // e.g., /Users/ableton/Move/Sets/set_id/_set
    const remoteTargetNamePath = path.join(remoteSetIdDirPath, name) // e.g., /Users/ableton/Move/Sets/set_id/Actual Song Name
    await this.renameRemoteDirectoryOrFile(remoteInternalSetPath, remoteTargetNamePath)

    // 3. Set attributes from metadata on the parent directory (the one named after setId)
    await this.setExtendedAttribute(remoteSetIdDirPath, XATTR_SONG_INDEX, set.meta.index.toString())
    await this.setExtendedAttribute(remoteSetIdDirPath, XATTR_SONG_COLOR, set.meta.color.toString())
    if (set.meta.localCloudState) {
      await this.setExtendedAttribute(
        remoteSetIdDirPath,
        XATTR_LOCAL_CLOUD_STATE,
        set.meta.localCloudState
      )
    }
    if (set.meta.lastModifiedTime) {
      await this.setExtendedAttribute(
        remoteSetIdDirPath,
        XATTR_LAST_MODIFIED_TIME,
        set.meta.lastModifiedTime
      )
    }
    // Note: wasExternallyModified is typically set by Ableton, maybe reset it?
    await this.setExtendedAttribute(
      remoteSetIdDirPath,
      XATTR_WAS_EXTERNALLY_MODIFIED,
      'false' // Resetting this flag might be appropriate on upload
    )

    // Return the original set object, assuming the upload was successful.
    // The remote path isn't directly stored in the Set object currently.
    return { ...set, path: remoteSetIdDirPath }
  }
  async deleteSet(setId: string): Promise<void> {
    await this.ssh.execCommand(`rm -r ${path.join(MOVE_SET_DIR_PATH, setId)}`)
  }

  /**
   * Retrieves the MAC address of eth0, or the first available non-loopback interface.
   * @returns The MAC address string, or null if none could be found.
   */
  async getMACAddress(): Promise<string | null> {
    const cmd = `ip link show eth0 2>/dev/null | awk '/link\\/ether/ {print $2}' || ip link | awk '/^[0-9]+: / { iface=$2; sub(/:$/, "", iface); found=0 } /^[0-9]+: .*mtu/ { found=1 } /^[[:space:]]+link\\/ether/ { if (iface != "lo" && found) { print $2; exit } }'`
    const result = await this.ssh.execCommand(cmd)

    if (result.stderr) {
      console.error('Error getting MAC address:', result.stderr)
      return null
    }

    const macAddress = result.stdout.toLowerCase().trim()
    return macAddress || null // Return null if stdout was empty
  }
}
