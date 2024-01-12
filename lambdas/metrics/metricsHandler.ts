import {
  MetricResolution,
  MetricUnits,
  Metrics,
  logMetrics,
} from '@aws-lambda-powertools/metrics';
import {
  MetricNames,
  ServiceNames,
  awsPowertoolsConfig,
} from '../common/awsPowertoolsConfig';
import { randomInt } from 'crypto';

const metrics = new Metrics({
  serviceName: ServiceNames.metricsTest,
  ...awsPowertoolsConfig,
});

export const metricsHandler = async () => {
  logMetrics(metrics, { captureColdStartMetric: true });

  metrics.addMetric(
    MetricNames.successes,
    MetricUnits.Count,
    randomInt(50),
    MetricResolution.Standard
  );

  metrics.addMetric(
    MetricNames.failures,
    MetricUnits.Count,
    randomInt(10),
    MetricResolution.Standard
  );

  metrics.publishStoredMetrics();
};
