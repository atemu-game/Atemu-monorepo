import { NestFactory } from '@nestjs/core';
import { OnChainQueueModule } from './app.module';
import configuration from '@app/shared/configuration';

async function bootstrap() {
  const app = await NestFactory.create(OnChainQueueModule);
  app.enableCors();
  await app.listen(configuration().ONCHAIN_QUEUE_PORT, () => {
    console.log(
      `Onchain Queue Service is running on: ${configuration().ONCHAIN_QUEUE_PORT}`,
    );
  });
}
bootstrap();
