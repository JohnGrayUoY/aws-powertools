import { LogFormatter } from '@aws-lambda-powertools/logger';
import {
  LogAttributes,
  UnformattedAttributes,
} from '@aws-lambda-powertools/logger/lib/types';

type DemoLog = LogAttributes;

export class DemoLogFormatter extends LogFormatter {
  public formatAttributes(attributes: UnformattedAttributes): DemoLog {
    return {
      demoFormat: {
        message: attributes.message,
        service: attributes.serviceName,
      },
      info: {
        logLevel: attributes.logLevel,
        timestamp: attributes.timestamp,
      },
    };
  }
}
