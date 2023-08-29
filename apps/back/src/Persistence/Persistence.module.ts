import { Module } from '@nestjs/common';
import { HealthProfessionalRepositoryModule } from './HealthProfessional/health-professional-repository.module';

@Module({
   imports: [HealthProfessionalRepositoryModule],
})
export class PersistenceModule {}
