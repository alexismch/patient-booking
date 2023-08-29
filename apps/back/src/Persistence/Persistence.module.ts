import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { HealthProfessionalRepositoryModule } from './HealthProfessional/health-professional-repository.module';

@Module({
   imports: [HealthProfessionalRepositoryModule],
   providers: [PrismaService],
})
export class PersistenceModule {}
