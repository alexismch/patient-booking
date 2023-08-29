import { Module } from '@nestjs/common';
import { APIModule } from './API/API.module';
import { DomainModule } from './Domain/Domain.module';
import { PersistenceModule } from './Persistence/Persistence.module';

@Module({ imports: [APIModule, DomainModule, PersistenceModule] })
export class CoreModule {}
