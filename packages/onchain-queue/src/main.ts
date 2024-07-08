import { NestFactory } from '@nestjs/core';
import { OnChainQueueModule } from './onChainQueue.module';

async function bootstrap() {
  const app = await NestFactory.create(OnChainQueueModule);
  await app.listen(3000);
}
bootstrap();
