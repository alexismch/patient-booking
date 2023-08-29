import { Module } from '@nestjs/common';
import { HealthProfessionalRepository } from './health-professional.repository';
import { PrismaModule } from '../Prisma/prisma.module';

@Module({
   imports: [PrismaModule],
   providers: [HealthProfessionalRepository],
   exports: [HealthProfessionalRepository],
})
export class HealthProfessionalRepositoryModule {}
