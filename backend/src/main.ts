import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(  new ValidationPipe({
    transform: true,
  }));

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });


  const config = new DocumentBuilder()
    .setTitle('Todo API')
    .setDescription('API for managing todos')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📄 Swagger UI available at: http://localhost:${port}/swagger`);
}

bootstrap();
