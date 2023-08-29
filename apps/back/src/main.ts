import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { CoreModule } from './core.module';

async function bootstrap() {
   const app = await NestFactory.create(CoreModule);

   app.enableShutdownHooks();

   app.useGlobalPipes(
      new ValidationPipe({
         whitelist: true,
         transform: true,
         validationError: {
            target: false,
            value: false,
         },
      }),
   );

   const port = process.env.PORT || 3000;
   await app.listen(port);

   Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
