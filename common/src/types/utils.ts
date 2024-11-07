import { BadgeTier } from './badge-definitions'
import { TierBadge, TierDay, TierEvent, TierId, TierLevel } from './tiers'

function getEnumKeyPosition(value: string): number {
  const keys = Object.keys(TierDay)
  return keys.indexOf(Object.keys(TierDay).find((key) => TierDay[key as keyof typeof TierDay] === value)!) + 1
}

const createEventBadgeTiers = (tierEvent: TierEvent, daysLabel: TierDay): BadgeTier[] => {
  const numerOfDays = getEnumKeyPosition(daysLabel)
  return Array(numerOfDays).map((day) => {
    return {
      tierId: `${tierEvent}-day-${daysLabel}` as TierId,
      tierName: `Day ${daysLabel}`,
      description: `Day ${daysLabel} in the ${tierEvent.split('_').join(' ')}`,
      criteria: { steps: day }
    }
  })
}

const capitalize = (text: string): string => {
  return text
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const createLevelBadgeTiers = (tierBadge: TierBadge, steps: number[], descriptions: string[]): BadgeTier[] => {
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

export { createEventBadgeTiers, createLevelBadgeTiers }
