import { Module } from '@nestjs/common';
import { HealthProfessionalAvailabilityController } from './controllers';
import { HealthProfessionalModule } from '../../Domain/HealthProfessional/health-professional.module';

@Module({
   imports: [HealthProfessionalModule],
   controllers: [HealthProfessionalAvailabilityController],
})
export class HealthProfessionalApiModule {}
