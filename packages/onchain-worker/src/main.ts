import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(configuration().ONCHAIN_WORKER_PORT, () => {
    console.log(
      `Onchain Worker Running on Port ${configuration().ONCHAIN_WORKER_PORT}`,
    );
  });
}
bootstrap();
