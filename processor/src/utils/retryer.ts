import { sleep } from './timer'

export default async function retry<T>(
  action: () => Promise<T>,
  retries: number = 3,
  waitTime: number = 300
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await action()
    } catch (error: any) {
      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts`, { cause: error })
      }
      await sleep(waitTime)
    }
  }
  throw new Error('Unexpected error: retry loop ended without throwing')
}