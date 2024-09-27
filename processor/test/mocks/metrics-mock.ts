import { createTestMetricsComponent } from '@well-known-components/metrics'
import { metricDeclarations } from './../../src/metrics'

export function createMetricsMock() {
    return createTestMetricsComponent(metricDeclarations)
}