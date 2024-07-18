import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(configuration().OFFCHAIN_WORKER_PORT, () => {
    console.log(
      `offchain worker is running on port ${configuration().OFFCHAIN_WORKER_PORT}`,
    );
  });
}
bootstrap();
