import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';

import { configureValidation, configureSwagger } from '@app/shared/config';
// import { AppClusterService } from '@app/shared/modules/cluster/app_cluster.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureSwagger(app);
  configureValidation(app);
  app.enableCors();
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  const PORT = configuration().API_PORT;

  await app.listen(PORT, () => {
    console.log(`Atemu api service is running on port ${PORT}`);
  });
}
// AppClusterService.clusterize(bootstrap);
bootstrap();
