import { IHttpServerComponent } from '@well-known-components/interfaces'
import { HandlerContextWithPath } from '../../types'
import { parseJson, NotFoundError } from '@dcl/platform-server-commons'
import { BadgeId } from '@badges/common'
import { parseBadgeId } from '../../logic/utils'

export async function badgesBackfillHandler(
  context: Pick<
    HandlerContextWithPath<'badgeService' | 'backfillMerger', '/badges/:id/backfill'>,
    'url' | 'request' | 'components' | 'params'
  >
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService, backfillMerger } = context.components
  const badgeId = context.params.id

  const parsedBadgeId: BadgeId | undefined = parseBadgeId(badgeId)

  if (!parsedBadgeId) {
    throw new NotFoundError('Badge does not exists')
  }

  const { registries } = await parseJson<{
    registries: {
      userAddress: string
      data: {
        progress: any
      }
    }[]
  }>(context.request)

  const promises = registries.map(async (registry) => {
    const { userAddress, data } = registry
    const currentUserProgress = await badgeService.getUserState(userAddress, parsedBadgeId)
    const mergedUserProgress = await backfillMerger.mergeUserProgress(
      parsedBadgeId,
      userAddress,
      currentUserProgress,
      data
    )

    await badgeService.saveOrUpdateUserProgresses([mergedUserProgress])
  })

  await Promise.all(promises)

  return {
    status: 204
  }
}
