import { Module } from '@nestjs/common';
import { HealthProfessionalApiModule } from './HealthProfessional/health-professional-api.module';

@Module({ imports: [HealthProfessionalApiModule] })
export class APIModule {}
