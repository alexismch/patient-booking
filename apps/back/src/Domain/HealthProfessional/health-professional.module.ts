import { Module } from '@nestjs/common';
import { HealthProfessionalRepositoryModule } from '../../Persistence/HealthProfessional/health-professional-repository.module';
import { HealthProfessionalService } from './services';

@Module({
   imports: [HealthProfessionalRepositoryModule],
   providers: [HealthProfessionalService],
   exports: [HealthProfessionalService],
})
export class HealthProfessionalModule {}
