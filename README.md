# Badges

## Database design

```mermaid
erDiagram
    user_progress {
        varchar user_address "(Part of CK) User's wallet address"
        varchar badge_id FK "(Part of CK) Identifier for the badge earned"
        json progress "Progress in JSON format describing how close is the user to get the badge"
        timestamp awarded_at "Timestamp when the badge was awarded"
    }
    badge {
        varchar id PK "ID of the badge (e.g., 'COMPLETED_STORE_AND_COLLECTION_SUBMITTED')"
        varchar name "Name of the badge"
        varchar description "Description of the badge"
        json criteria "Criteria in JSON format describing how to earn the badge"
    }

    badge ||--o{ user_progress : "badge_id"
```