# Badges

## Database design

```mermaid
erDiagram
    UserActivityEvents {
        varchar event_id PK "UUID primary key"
        varchar user_address "User's wallet address"
        varchar event_type "Type of event (e.g., 'scene_visit')"
        json event_details "Aggregated event's details in JSON format"
        timestamp event_timestamp "Timestamp of the event"
    }
    BadgeCriteria {
        varchar badge_id PK "ID of the badge (e.g, 'COMPLETED_STORE_AND_COLLECTION_SUBMITTED')"
        varchar badge_name "Name of the badge"
        varchar badge_description "Description of the badge"
        json criteria "Criteria in JSON format describing how to earn the badge"
    }
    UserBadges {
        varchar user_address "(Part of CK) User's wallet address"
        varchar badge_id FK "(Part of CK) Identifier for the badge earned"
        json progress "Progress in JSON format describing how close is the user to get the badge"
        timestamp awarded_at "Timestamp when the badge was awarded"
    }

    BadgeCriteria ||--o{ UserBadges : "badge_id"
```