import { Logger } from '@aws-lambda-powertools/logger';
import { ConstructorOptions } from '@aws-lambda-powertools/logger/lib/types';
import { Context } from 'aws-lambda';
import { DemoLogFormatter } from './formatters/DemoLogFormatter';

const loggerConfig: ConstructorOptions = {
  serviceName: 'logging-handler',
  logLevel: 'DEBUG',
};

// This is a logger instance using the standard data format.
const logger = new Logger(loggerConfig);

// This is a logger instance which has the DemoLogFormatter to format the logs it outputs.
const loggerWithDemoFormatter = new Logger({
  logFormatter: new DemoLogFormatter(),
});

export const loggingHandler = (_event: any, _context: Context) => {
  // Add the context to the logger to add additional values to logs.
  logger.addContext(_context);

  // Append manual info to all generated logger logs.
  logger.appendKeys({
    custom_key: 'custom_value',
  });

  logger.info('logger.info invoked');

  loggerWithDemoFormatter.info('loggerWithDemoFormatter.info invoked');

  // Pass an object with a one off property to be logged with this warn only.
  logger.warn('logger.warn invoked', {
    one_off_custom_key: 'one_off_custom_value',
  });

  try {
    throw new Error(
      'This is an error to be handled and logged by the AWS Powertools Logger'
    );
  } catch (error) {
    logger.error('logger.error invoked', error as Error);
  }
};
