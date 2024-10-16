import { IHttpServerComponent } from '@well-known-components/interfaces'
import { HandlerContextWithPath } from '../../types'
import { parseJson, NotFoundError } from '@dcl/platform-server-commons'
import { Badge, BadgeId, UserBadge } from '@badges/common'
import { parseBadgeId, validateUserProgress } from '../../logic/utils'

export async function badgesBackfillHandler(
  context: Pick<
    HandlerContextWithPath<'badgeService' | 'backfillMerger' | 'logs', '/badges/:id/backfill'>,
    'url' | 'request' | 'components' | 'params'
  >
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService, backfillMerger, logs } = context.components
  const logger = logs.getLogger('badges-backfill-handler')
  try {
    const badgeId = context.params.id

    const parsedBadgeId: BadgeId | undefined = parseBadgeId(badgeId)

    if (!parsedBadgeId) {
      throw new NotFoundError('Badge does not exists')
    }

    const badge: Badge = badgeService.getBadge(parsedBadgeId)

    const { registries } = await parseJson<{
      registries: {
        userAddress: string
        data: {
          progress: any
        }
      }[]
    }>(context.request)

    const userProgressesPromises = registries.map(async (registry) => {
      const { userAddress, data } = registry
      logger.info('Processing backfill for user', {
        userAddress,
        badgeId: parsedBadgeId
      })
      const currentUserProgress = await badgeService.getUserState(userAddress, parsedBadgeId)

      return backfillMerger.mergeUserProgress(parsedBadgeId, userAddress, currentUserProgress, {
        ...data,
        badgeId: parsedBadgeId
      })
    })

    const userProgresses = await Promise.all(userProgressesPromises)
    const { validUserProgresses, invalidUserProgresses } = userProgresses.reduce(
      (acc, userProgress) => {
        const validationResult = validateUserProgress(userProgress, badge)

        if (validationResult.ok) {
          acc.validUserProgresses.push(userProgress)
        } else {
          acc.invalidUserProgresses.push({ userProgress, errors: validationResult.errors })
        }

        return acc
      },
      { validUserProgresses: [], invalidUserProgresses: [] } as {
        validUserProgresses: UserBadge[]
        invalidUserProgresses: { userProgress: UserBadge; errors: string[] }[]
      }
    )

    if (validUserProgresses.length > 0) {
      await badgeService.saveOrUpdateUserProgresses(validUserProgresses)
    }

    return {
      status: 200,
      body: {
        data: {
          badge,
          userProgressesMerged: validUserProgresses.length,
          failures: invalidUserProgresses.map(({ userProgress, errors }) => ({
            address: userProgress.user_address,
            errors
          }))
        }
      }
    }
  } catch (error: any) {
    const status = error instanceof NotFoundError ? 404 : error.status || 500

    logger.error('Error processing backfill', {
      error: error.message,
      stack: JSON.stringify(error.stack)
    })

    return {
      status,
      body: {
        message: error.message,
        details: {
          stack: error.stack
        }
      }
    }
  }
}
