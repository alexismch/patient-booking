import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { CoreModule } from './core.module';

async function bootstrap() {
   const app = await NestFactory.create(CoreModule);

   app.enableShutdownHooks();

   const port = process.env.PORT || 3000;
   await app.listen(port);

   Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
