import fs from 'fs'
import path from 'path'

function is2dOr3dDirectoryName(directoryName: string): boolean {
  return (
    directoryName === '2d' ||
    directoryName === '3d' ||
    directoryName.includes('2d') ||
    (directoryName.includes('3d') &&
      (directoryName.includes('starter') ||
        directoryName.includes('bronze') ||
        directoryName.includes('silver') ||
        directoryName.includes('gold') ||
        directoryName.includes('platinum') ||
        directoryName.includes('diamond') ||
        directoryName.includes('base')))
  )
}

export function parseTexturesDirectoryName(directoryName: string): string {
  return is2dOr3dDirectoryName(directoryName)
    ? directoryName
    : directoryName
        .replace(/([a-z])([A-Z])/g, '$1_$2') // Convert PascalCase to snake_case
        .replace(/([a-zA-Z])(\d)/g, '$1_$2') // Add underscore between letters and numbers
        .replace(/(\d)([a-zA-Z])/g, '$1_$2') // Add underscore between numbers and letters
        .toLowerCase()
}

export function trimBadgeName(name: string, badgeName: string): string {
  return name.replace(new RegExp(`^${badgeName}`, 'i'), '').toLowerCase()
}

export function logAllFilesWithinDirectory(directoryPath: string): void {
  fs.readdirSync(directoryPath).forEach((file) => {
    if (fs.statSync(path.join(directoryPath, file)).isDirectory()) {
      console.log(`Directory: ${file}`)
      logAllFilesWithinDirectory(path.join(directoryPath, file))
    } else {
      console.log(`File: ${file}`)
    }
  })
}
