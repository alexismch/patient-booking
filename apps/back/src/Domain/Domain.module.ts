import { Module } from '@nestjs/common';
import { HealthProfessionalModule } from './HealthProfessional/health-professional.module';

@Module({ imports: [HealthProfessionalModule] })
export class DomainModule {}
