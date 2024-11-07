# Badges

Badges is the service responsible for handling users' achievements within the Decentraland ecosystem. These achievements guide users through the platform, including actions both within and outside the virtual world.

## Table of Content

- [Architecture Overview](#architecture-overview)
- [Events published by this service](#events-published-by-this-service)
- [Service Design Overview](#service-design-overview)
    - [Badges API](#badges-api)
    - [Badges Processor](#badges-processor)
        - [Badges Handling Workflow](#badges-handling-workflow)
    - [How to Create a New Badge](#how-to-create-a-new-badge)
    - [Additional Systems Involved](#additional-systems-involved)
        - [Events Notifier](#events-notifier)
        - [Catalyst](#catalyst)
        - [Notifications](#notifications)

## Architecture Overview

The badge service is composed of two systems: `badge-processor` and `badge-api`. These systems are deployed as separate ECS Tasks, meaning each service has its own definitions and operates independently.

This service subscribes to various events through an SNS/SQS architecture set up by the `definitions` service. Currently, the service does not filter any events at the SNS level, meaning it listens to all incoming events on the SNS topic and analyzes whether it should handle them.

## Events published by this Service

Whenever a badge is granted to a user, the service publishes a `badge-granted` event to an SNS topic that other services can subscribe to and respond to. [This private topic](https://dcl.tools/ops/event-driven-sns) is used within the private foundation architecture, but the service can be configured to notify any SNS topic.

```typescript
import { BadgeGrantedEvent } from '@dcl/schemas/dist/platform/events/services';

export type BadgeGrantedEvent = BaseEvent & {
    type: Events.Type.BADGE;
    subType: Events.SubType.Badge.GRANTED;
    metadata: {
        badgeId: string;
        badgeName: string;
        badgeTierName?: string;
        badgeImageUrl: string;
        address: string;
    };
};
```

## Service Design Overview

### Badges API

The `badges-api` exposes the endpoints required to interact with badges:

- `GET https://badges.decentraland.{{tld}}/status`
    - Returns the service status.

- `GET https://badges.decentraland.{{tld}}/categories`
  - Returns all badge categories.
  
- `GET https://badges.decentraland.{{tld}}/badges`
  - Returns all badge definitions.
  
- `GET https://badges.decentraland.{{tld}}/badges/<id>`
  - Returns a specific badge definition.
  
- `GET https://badges.decentraland.{{tld}}/badges/<id>/tiers`
  - Returns tier information for a specific badge. If no tiers are defined, the response will be empty.
  
- `GET https://badges.decentraland.{{tld}}/users/<address>/badges?includeNotAchieved=true|false|undefined`
  - Returns the user's status for all badges in which they have made progress. If `includeNotAchieved` is set to `true`, badges the user has not started or made progress in will also be included. This endpoint is used by the explorer to render the user's passport view, showing all progress.

- `GET https://badges.decentraland.{{tld}}/users/<address>/preview`
  - Returns the last 5 badges the user has achieved. If multiple tiers of the same badge have been achieved (e.g., `traveler bronze` and `traveler silver`), each tier will be returned as a separate badge.

- `POST https://badges.decentraland.{{tld}}/users/<address>/backfill`
    - This endpoint is restricted by an `Authorization` header that must contain a specific token set through the `API_ADMIN_TOKEN` environment variable. It is used to retroactively assign badges by merging users’ progress data in the database.

### Badges Processor

The `badges-processor` listens to events from various sources (e.g., blockchain, explorer, catalyst, or other services publishing events to the specified SNS topic) and performs the following tasks:
1. Executes all badge handlers relevant to the incoming event.
2. Each handler updates the user's progress (e.g., updating the progress for the `traveler` badge when the user visits a new scene) and grants a badge if the criteria are met.
3. If a badge is granted, the service publishes a `badge-granted` event, which is handled by the `notification-service` to deliver the appropriate notification. It also records the granting in the database.

#### Badges Handling Workflow

The `badge-processor` service implements the Observer pattern, where handlers are registered for each event the service needs to handle. Handlers are registered in `processor/src/components.ts`, and the `event-dispatcher.ts` component distributes events to the relevant handlers:

1. An event is received by `processor/src/logic/message-consumer.ts`.
2. The event is processed by `processor/src/logic/message-processor.ts`.
3. The `event-dispatcher.ts` component distributes the event to the appropriate handlers. Multiple handlers can be associated with a single event, and a handler can handle multiple events.
4. Each handler, located in `processor/src/logic/badges/`, manages a single badge.

Interfaces:

```typescript
// Badge handlers interface
export type IObserver = {
  getUserAddress(event: Event): EthAddress
  handle(event: Event, userProgress?: UserBadge): Promise<any>
  badgeId: BadgeId
  badge: Badge
  events: EventId[]
}

export type MessageConsumerComponent = IBaseComponent

export type MessageProcessorComponent = {
  process(message: Event): Promise<void>
}

export type IEventDispatcher = {
  getObservers(): Map<string, IObserver[]>
  registerObserver(observer: IObserver): void
  dispatch(event: Event): Promise<any>
}
```

#### Entities structure

**Badges**
```typescript
export type Badge = {
  id: BadgeId
  name: string
  category: string
  description: string
  criteria?: { steps: number } & any
  assets?: BadgeAssets
  tiers?: BadgeTier[]
}

export type BadgeTier = {
  tierId: string
  /**
   * The tier name
   * e.g. "Bronze", "Silver", "Gold"
   * @type {string}
   */
  tierName: string
  criteria?: { steps: number } & any
  description: string
  assets?: BadgeAssets
}
```

**User progress**
```typescript
export type UserBadge = {
  user_address: string
  badge_id: BadgeId
  progress: any
  achieved_tiers?: { tier_id: string; completed_at: number }[]
  completed_at?: number
  updated_at?: number
}
```

Progress should be a JSON object that stores useful information to track which actions the user has taken to achieve the related badge.

### How to Create a New Badge

To create a new badge, follow these steps:

1. Add the event definition in the [common schemas library](https://github.com/decentraland/schemas) (`src/platform/events`).
2. Expose the event definition as an event (add the new badge definition to the `Event` type in `src/platform/events/base.ts`).
3. If the badge needs to handle an event not currently delivered through the event-driven architecture:
   - a. In the [`events-notifier`](https://github.com/decentraland/events-notifier) repository, do the following:
     - i. For explorer events: ask the Data team to deliver it to the webhook exposed in the `events-notifier` service. Then, add the necessary event parsing in `src/adapters/event-parser.ts`.
     - ii. For blockchain events: add the appropriate producer in `src/adapters/producers`.
   - b. Next, after producing and mapping the new event correctly, check the `processor/src/adapters/event-parser.ts` file and type the new event correctly to be handled later by the corresponding observers.
4. Create the badge ID in `common/src/types/badge-definitions.ts` in the Badge repository.
   - a. Ensure the textures are uploaded to the `assets-cdn` S3 bucket, using the directory name as the BadgeId for correct mapping.
5. Add the badge definition in `common/src/types/badges.ts`.
   - a. The badge details should be available in the Google spreadsheet linked in the `#project-badges` Slack channel.
6. Add the badge handler in `processor/src/logic/badges` and register it in `processor/src/components.ts`.
   - a. Follow naming conventions (`snake_case`) in the database (e.g., `this_is_an_example_of_a_property_name`).
7. (Optional) If needed, add the badge backfill process to' API/src/logic/backfills` and register it in `api/src/logic/backfill-merger.ts`.
   - a. Follow the payload interface defined with the Data Team that should be described in the following notion page: [Badges Feed](https://www.notion.so/decentraland/Badges-Feed-10d4aa23e5a9453485849a1b083c6111?pvs=4).

### Additional Systems Involved

The badge service is part of an `event-driven architecture`, meaning it listens to events from various sources and publishes events for other systems to act upon.

#### Events Notifier

This service acts as a bridge to connect external event sources to the event-driven architecture (SNS topic). Currently, it forwards events from:

- **Explorer alpha**:
  - The Explorer client sends events to Segment, which forwards them to a webhook exposed by this service (`https://events-notifier.decentraland.{{tld}}/forward`).
  - This webhook validates the event and forwards it to the SNS topic connected to the badges service.
  
- **Blockchain**:
  - Producers in `src/adapters/producers` query graphs to retrieve blockchain events.
  - This is soon to be replaced by direct events report on different `dApps services` and `Subsquid`.

#### Catalyst

The Badges service also receives deployments from `Catalyst`, which are reported via `deployments-to-sqs`. The `deployments-to-sqs` service listens for deployments made to `Catalyst` servers and forwards them to an SNS topic, to which the `Badges service` is subscribed.

#### Notifications

After the `badges-processor` service handles an event, a badge can be granted to a user if specific criteria (_the badge definition_) are met. When a badge is granted, a new event is published to the SNS topic, which is then picked up by the `notification service`. This service is responsible for notifying the user about the badge through in-world notifications.
