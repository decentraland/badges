import { BadgeTier } from './badge-definitions'
import { TierBadge, TierDay, TierEvent, TierId, TierLevel } from './tiers'

function getOrdinalForTierDay(value: TierDay): number {
  const keys = Object.keys(TierDay)
  return keys.indexOf(Object.keys(TierDay).find((key) => TierDay[key as keyof typeof TierDay] === value)!) + 1
}

const createEventBadgeTiers = (tierEvent: TierEvent, daysLabel: TierDay): BadgeTier[] => {
  const numberOfDays = getOrdinalForTierDay(daysLabel)
  return Array.from({ length: numberOfDays }, (_, key) => ({
    tierId: `${tierEvent}-day-${daysLabel}` as TierId,
    tierName: `${daysLabel} day`,
    description: `${daysLabel} day in the ${tierEvent.split('-').join(' ')}`,
    criteria: { steps: key + 1 }
  }))
}

const capitalize = (text: string): string => {
  return text
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const createLevelBadgeTiers = (tierBadge: TierBadge, steps: number[], descriptions: string[]): BadgeTier[] => {
  if (steps.length !== Object.values(TierLevel).length) {
    throw new Error('The number of steps must match the number of levels')
  }
  const levels = Object.values(TierLevel)

  return levels.map((level, step) => {
    return {
      tierId: `${tierBadge}-${level}` as TierId,
      tierName: capitalize(level),
      description: descriptions[step],
      criteria: { steps: steps[step] }
    }
  })
}

export { getOrdinalForTierDay, createEventBadgeTiers, createLevelBadgeTiers, capitalize }
