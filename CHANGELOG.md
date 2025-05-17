# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2025-05-18

### Added

- Ability to download all .ablbundles from the Move device into a selected directory

### Fixed

- Fixed: Some users could get stuck on a disclaimer page


## [0.3.14] - 2025-05-17

### Fixed

- (Win) Fixed the Windows build process
- (Win) Fixed crash in the compiled windows application due to empty process.env.HOME
- (Win) Fixed nonfunctional download and upload page functionality

## [0.3.8] - 2025-05-17

### Fixed

- Ignore .DS_Store files when syncing sets
- Set a name and email into git config if none are set on the global level

## [0.3.1] - 2025-05-15

### Added

- More disclaimers

### Fixed

- Use POSIX paths on non POSIX systems when adressing remote MOVE paths

## [0.2.0] - 2025-05-09

### Added

- Logging on the tRPC server and client.

## [0.1.0] - 2025-05-09

### Added

- Initial release.
