import { Tracer } from '@aws-lambda-powertools/tracer';
import { ServiceNames } from '../common/awsPowertoolsConfig';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

// Tracer must be instantiated outside of handler to have full awareness of lambda execution (cold starts etc.)
const tracer = new Tracer({ serviceName: ServiceNames.tracerTest });

class TracerLambda implements LambdaInterface {
  @tracer.captureLambdaHandler()
  public async handler(_event: any, _context: any): Promise<void> {
    const randomMathsSegment = tracer
      .getSegment()
      ?.addNewSubsegment('Random Maths');
    randomMathsSegment && tracer.setSegment(randomMathsSegment);

    let totalValue = 0;

    for (let i = 0; i < 1000; i++) {
      const randomValue = Math.random() * 1000;
      const sqrt = Math.sqrt(randomValue);
      totalValue += sqrt;
    }

    tracer.putAnnotation('Random Value', totalValue);

    randomMathsSegment?.close();
    randomMathsSegment && tracer.setSegment(randomMathsSegment?.parent);

    return;
  }
}

const tracerLambda = new TracerLambda();
export const tracerHandler = tracerLambda.handler.bind(tracerLambda);
