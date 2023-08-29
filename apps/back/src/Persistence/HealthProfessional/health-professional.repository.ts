import { Injectable } from '@nestjs/common';
import { PrismaService } from '../Prisma';
import { Prisma } from '.prisma/client';

@Injectable()
export class HealthProfessionalRepository {
   private model: Prisma.HealthProfessionalDelegate;

   constructor(prismaService: PrismaService) {
      this.model = prismaService.healthProfessional;
   }

   async getById(
      id: number,
      options: {
         include?: {
            availabilities?: boolean;
            events?: boolean;
         };
      } = {},
   ) {
      return this.model.findUnique({
         where: {
            id,
         },
         include: options?.include,
      });
   }
}
