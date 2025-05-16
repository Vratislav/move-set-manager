import { NodeSSH } from 'node-ssh'
import { FileEntryWithStats, SFTPWrapper, Stats } from 'ssh2'
import * as fs from 'fs'
import * as path from 'path'

export async function getDirectoryListing(
  sftp: SFTPWrapper,
  dir: string
): Promise<FileEntryWithStats[]> {
  const promise = new Promise<FileEntryWithStats[]>((resolve, reject) => {
    sftp.readdir(dir, (err, list) => {
      if (err) {
        reject(err)
      } else {
        resolve(list)
      }
    })
  })
  return promise
}

export async function setExtendedAttribute(
  ssh: NodeSSH,
  path: string,
  key: string,
  value: string
): Promise<void> {
  await ssh.exec('setfattr', ['-n', key, '-v', value, path])
}

export async function getExtendedAttributes(
  ssh: NodeSSH,
  path: string
): Promise<{ [key: string]: string }> {
  const result = await ssh.execCommand(`getfattr -d -m . "${path}"`)
  if (result.code === 1) {
    throw new Error(`Failed to get extended attributes for ${path}: ${result.stderr}`)
  }

  const attributes: { [key: string]: string } = {}
  const lines = result.stdout.split('\n')
  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') {
      continue
    }
    const match = line.match(/^(.*?)=("?(.*?)"?)$/)
    if (match && match.length >= 4) {
      const key = match[1]
      const value = match[3] // Group 3 captures the value without quotes
      attributes[key] = value
    }
  }
  return attributes
}

export async function getPathStat(sftp: SFTPWrapper, path: string): Promise<Stats> {
  const promise = new Promise<Stats>((resolve, reject) => {
    sftp.stat(path, (err, stats) => {
      if (err) {
        reject(err)
      } else {
        resolve(stats)
      }
    })
  })
  return promise
}

export async function copyRecursiveFromRemote(
  sftp: SFTPWrapper,
  localBaseDir: string,
  remoteFileOrDir: string
): Promise<void> {
  const remotePathStat = await getPathStat(sftp, remoteFileOrDir)
  const baseName = path.basename(remoteFileOrDir)
  //console.log(`Local path: ${localBaseDir} + ${baseName}`);
  const localPath = path.join(localBaseDir, baseName)

  if (remotePathStat.isFile()) {
    //console.log(`Copying remote file ${remoteFileOrDir} to ${localPath}`);
    await new Promise<void>((resolve, reject) => {
      sftp.fastGet(remoteFileOrDir, localPath, (err) => {
        if (err) {
          reject(
            new Error(`Failed to copy file ${remoteFileOrDir} to ${localPath}: ${err.message}`)
          )
        } else {
          resolve()
        }
      })
    })
  } else if (remotePathStat.isDirectory()) {
    //console.log(`Creating local directory ${localPath}`);
    await fs.promises.mkdir(localPath, { recursive: true })
    //console.log(`Listing remote directory ${remoteFileOrDir}`);
    const entries = await getDirectoryListing(sftp, remoteFileOrDir)
    for (const entry of entries) {
      const remoteEntryPath = path.join(remoteFileOrDir, entry.filename)
      // Note: We pass localPath as the *new* base directory for recursive calls
      await copyRecursiveFromRemote(sftp, localPath, remoteEntryPath)
    }
  } else {
    // Handle other types like symbolic links if necessary, or throw an error
    console.warn(`Skipping unsupported file type at ${remoteFileOrDir}`)
  }
}

export async function copyRecursiveToRemote(
  sftp: SFTPWrapper,
  localFileOrDir: string,
  remoteBaseDir: string
): Promise<void> {
  const localPathStat = await fs.promises.stat(localFileOrDir)
  const baseName = path.basename(localFileOrDir)
  const remotePath = path.join(remoteBaseDir, baseName)

  if (localPathStat.isFile() && !localFileOrDir.endsWith('.DS_Store')) {
    //console.log(`Copying local file ${localFileOrDir} to ${remotePath}`);
    await new Promise<void>((resolve, reject) => {
      sftp.fastPut(localFileOrDir, remotePath, (err) => {
        if (err) {
          reject(
            new Error(`Failed to copy file ${localFileOrDir} to ${remotePath}: ${err.message}`)
          )
        } else {
          resolve()
        }
      })
    })
  } else if (localPathStat.isDirectory()) {
    //console.log(`Creating remote directory ${remotePath}`);
    await new Promise<void>((resolve, reject) => {
      sftp.mkdir(remotePath, (err) => {
        if (err) {
          // Ignore error if directory already exists
          if (err.message !== 'Failure') {
            return reject(
              new Error(`Failed to create remote directory ${remotePath}: ${err.message}`)
            )
          }
        }
        resolve()
      })
    })

    //console.log(`Listing local directory ${localFileOrDir}`);
    const entries = await fs.promises.readdir(localFileOrDir)
    for (const entry of entries) {
      const localEntryPath = path.join(localFileOrDir, entry)
      // Note: We pass remotePath as the *new* base directory for recursive calls
      await copyRecursiveToRemote(sftp, localEntryPath, remotePath)
    }
  } else {
    // Handle other types like symbolic links if necessary, or throw an error
    console.warn(`Skipping unsupported file type at ${localFileOrDir}`)
  }
}

export async function renameRemoteDirectoryOrFile(
  sftp: SFTPWrapper,
  oldPath: string,
  newPath: string
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    sftp.rename(oldPath, newPath, (err) => {
      if (err) {
        reject(new Error(`Failed to rename ${oldPath} to ${newPath}: ${err.message}`))
      } else {
        resolve()
      }
    })
  })
}
