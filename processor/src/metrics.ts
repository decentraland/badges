import { getDefaultHttpMetrics } from '@well-known-components/http-server'
import { metricDeclarations as logMetricDeclarations } from '@well-known-components/logger'
import { metricDeclarations as pgMetricDeclarations } from '@well-known-components/pg-component'
import { validateMetricsDeclaration } from '@well-known-components/metrics'
import { IMetricsComponent } from '@well-known-components/interfaces'

export const metricDeclarations = {
  ...getDefaultHttpMetrics(),
  ...pgMetricDeclarations,
  ...logMetricDeclarations,
  events_correctly_handled_count: {
    help: 'Count of events correctly handled',
    type: IMetricsComponent.CounterType,
    labelNames: ['event_type', 'event_sub_type']
  },
  handler_failures_count: {
    help: 'Count of event handling failures',
    type: IMetricsComponent.CounterType,
    labelNames: ['event_type', 'event_sub_type', 'badge_name']
  },
  processing_failures_count: {
    help: 'Count of processing failures',
    type: IMetricsComponent.CounterType,
    labelNames: ['event_type', 'event_sub_type']
  },
  badges_granted_count: {
    help: 'Count of badges granted',
    type: IMetricsComponent.CounterType
  },
  events_processing_duration_seconds: {
    help: 'Histogram of events processing duration in seconds',
    type: IMetricsComponent.HistogramType,
    buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30]
  },
  attached_observers_count: {
    help: 'Count of attached observers',
    type: IMetricsComponent.GaugeType,
    labelNames: ['event_type', 'event_sub_type', 'badge_name']
  },
  available_badges: {
    help: 'Count of available badges',
    type: IMetricsComponent.GaugeType,
    labelNames: ['badge_name', 'badge_category']
  },
  webhook_badges_event_delay_in_seconds_total: {
    type: IMetricsComponent.CounterType,
    help: 'Delay between webhook and badge handling event',
    labelNames: ['event_type']
  },
  explorer_events_arriving_to_badges_count: {
    type: IMetricsComponent.CounterType,
    help: 'Count of explorer events arriving to badges',
    labelNames: ['event_type']
  }
}

// type assertions
validateMetricsDeclaration(metricDeclarations)
