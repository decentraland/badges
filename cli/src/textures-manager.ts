import prompts from 'prompts'
import fs from 'fs'
import path from 'path'
import AWS from 'aws-sdk'
import mime from 'mime-types'

const outputDirectory = path.join(__dirname, '../../textures-output')

const toSnakeCase = (directoryName: string): string => {
  if (
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
  ) {
    return directoryName // Leave '2d' and '3d' unchanged
  }
  return directoryName
    .replace(/([a-z])([A-Z])/g, '$1_$2') // Convert PascalCase to snake_case
    .replace(/([a-zA-Z])(\d)/g, '$1_$2') // Add underscore between letters and numbers
    .replace(/(\d)([a-zA-Z])/g, '$1_$2') // Add underscore between numbers and letters
    .toLowerCase()
}

const trimBadgeName = (name: string, badgeName: string) => {
  return name.replace(new RegExp(`^${badgeName}`, 'i'), '').toLowerCase()
}

// const renameAndCopyFiles = (srcDir: string, destDir: string, badgeName: string) => {
//   fs.readdir(srcDir, (err, files) => {
//     if (err) throw err

//     files.forEach((file) => {
//       const srcFilePath = path.join(srcDir, file)
//       const stat = fs.statSync(srcFilePath)

//       if (stat.isDirectory()) {
//         const trimmedName = trimBadgeName(file, badgeName)
//         let newDirectoryName: string = toSnakeCase(trimmedName)

//         const match = newDirectoryName.match(/2d|3d/)
//         if (match) {
//           newDirectoryName = match[0]
//         }

//         // if directory is called base rename it to starter
//         if (newDirectoryName === 'base') {
//           newDirectoryName = 'starter'
//         }

//         const newDestDir = path.join(destDir, newDirectoryName)

//         fs.mkdirSync(newDestDir, { recursive: true })

//         // Recursively process the directory
//         renameAndCopyFiles(srcFilePath, newDestDir, badgeName)
//       } else {
//         if (file !== '.DS_Store') {
//           let newFileName = file

//           if (newFileName.includes('_basecolor')) {
//             newFileName = 'basecolor.png'
//           } else if (newFileName.includes('_hrm')) {
//             newFileName = 'hrm.png'
//           } else if (newFileName.includes('_normal') || newFileName.match(/\.png$/)) {
//             newFileName = 'normal.png'
//           }

//           const destFilePath = path.join(destDir, newFileName)

//           // Copy the file to the new location with the new name
//           fs.copyFileSync(srcFilePath, destFilePath)
//         }
//       }
//     })
//   })
// }

// Function to start processing from the root directory

const renameAndCopyFiles = (srcDir: string, destDir: string, badgeName: string) => {
  fs.readdir(srcDir, (err, files) => {
    if (err) throw err

    files.forEach((file) => {
      const srcFilePath = path.join(srcDir, file)
      const stat = fs.statSync(srcFilePath)

      if (stat.isDirectory()) {
        const trimmedName = trimBadgeName(file, badgeName)
        let newDirectoryName: string = toSnakeCase(trimmedName)

        const match = trimmedName.match(/2d|3d/i) // Check for "2d" or "3d"
        if (match) {
          newDirectoryName = match[0].toLowerCase() // Force lowercase "2d" or "3d"
          console.log(`Matched special directory name: ${newDirectoryName}`) // Debug log
        }

        // If the directory is called "base", rename it to "starter"
        if (newDirectoryName === 'base') {
          newDirectoryName = 'starter'
        }

        const newDestDir = path.join(destDir, newDirectoryName)

        fs.mkdirSync(newDestDir, { recursive: true })

        // Recursively process the directory
        renameAndCopyFiles(srcFilePath, newDestDir, badgeName)
      } else {
        if (file !== '.DS_Store') {
          let newFileName = file

          if (newFileName.includes('_basecolor')) {
            newFileName = 'basecolor.png'
          } else if (newFileName.includes('_hrm')) {
            newFileName = 'hrm.png'
          } else if (newFileName.includes('_normal') || newFileName.match(/\.png$/)) {
            newFileName = 'normal.png'
          }

          const destFilePath = path.join(destDir, newFileName)

          // Copy the file to the new location with the new name
          fs.copyFileSync(srcFilePath, destFilePath)
        }
      }
    })
  })
}

const processDirectory = (srcRoot: string, destRoot: string) => {
  fs.mkdirSync(destRoot, { recursive: true })

  fs.readdir(srcRoot, (err, directories) => {
    if (err) throw err

    directories.forEach((dir) => {
      const srcDirPath = path.join(srcRoot, dir)
      const stat = fs.statSync(srcDirPath)

      if (stat.isDirectory()) {
        const newDirName = toSnakeCase(dir)
        const newDestDirPath = path.join(destRoot, newDirName)

        fs.mkdirSync(newDestDirPath, { recursive: true })

        // Process each subdirectory within the badge directory
        renameAndCopyFiles(srcDirPath, newDestDirPath, dir)
      }
    })
  })
}

export async function uploadTextures() {
  const directory = await prompts({
    type: 'text',
    name: 'src',
    message: 'Enter the directory holding the textures (src):'
  })

  processDirectory(directory.src, outputDirectory)
  logDirectory(outputDirectory)

  const shouldWeContinue = await prompts({
    type: 'confirm',
    name: 'continue',
    message: 'Do you want to continue?'
  })

  if (!shouldWeContinue.continue) {
    console.log('Removing textures output directory...')
    fs.rmdirSync(outputDirectory, { recursive: true })
    return
  } else {
    // select bucket from two options
    const selection = await prompts({
      type: 'select',
      name: 'bucket',
      message: 'Select the S3 bucket environment:',
      choices: [
        { title: 'prd', value: 'assets-cdn-decentraland-org-contentbucket-6898728' },
        { title: 'dev', value: 'assets-cdn-decentraland-zone-contentbucket-79cb984' }
      ]
    })

    const awsAccessKeyId = await prompts({
      type: 'text',
      name: 'key',
      message: 'Enter your AWS Access Key ID:'
    })
  
    const awsSecretAccessKey = await prompts({
      type: 'text',
      name: 'key',
      message: 'Enter your AWS Secret Access Key:'
    })

    const s3 = new AWS.S3({
      accessKeyId: awsAccessKeyId.key,
      secretAccessKey: awsSecretAccessKey.key,
      region: 'us-east-1' // default region, do not change
    })

    await uploadDirectory(s3, selection.bucket, outputDirectory)
  }
}

const logDirectory = (dir: string) => {
  // read files of the textures directory and log the structure
  fs.readdir(dir, (err, files) => {
    if (err) throw err

    files.forEach((file) => {
      // if it is a directory log files inside
      if (fs.statSync(path.join(outputDirectory, file)).isDirectory()) {
        fs.readdir(path.join(outputDirectory, file), (err, subFiles) => {
          if (err) throw err

          console.log(file)
          subFiles.forEach((subFile) => {
            console.log(`  ${subFile}`)
          })
        })
      } else {
        console.log(file)
      }
    })
  })
}

const uploadDirectory = async (s3Client: AWS.S3, bucketName: string, dirPath: string, s3Folder: string = '') => {
  console.log('Uploading textures...')

  const files = fs.readdirSync(dirPath)

  for (const fileName of files) {
    if (fileName && fileName === '.DS_Store') {
      continue
    }

    const fullPath = path.join(dirPath, fileName)
    const fileStats = fs.statSync(fullPath)

    if (fileStats.isDirectory()) {
      // Recursively upload inner directories
      await uploadDirectory(s3Client, bucketName, fullPath, `${s3Folder}${fileName}/`)
    } else {
      const fileContent = fs.readFileSync(fullPath)
      const mimeType = mime.lookup(fullPath) || 'application/octet-stream'

      const params = {
        Bucket: bucketName,
        Key: `${s3Folder}${fileName}`,
        Body: fileContent,
        ContentType: mimeType
      }

      await s3Client.upload(params).promise()
      console.log(`Uploaded ${fileName} to ${bucketName}/${s3Folder}${fileName}`)
    }
  }
}
