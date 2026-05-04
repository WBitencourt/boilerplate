import { Module } from '@nestjs/common';
import { ExampleController } from '@/presentation/http/routes/example/example.controller';
import { ExampleService } from '@/presentation/http/routes/example/example.service';
import { DatabaseModule as PrismaDatabaseModule } from '@/database/prisma-database.module';
import { DatabaseModule as TypeOrmDatabaseModule } from '@/database/typeorm-database.module';
import { PrismaExampleRepository } from '@/database/repositories/prisma-example.repository';
import { TypeOrmExampleRepository } from '@/database/repositories/typeorm-example.repository';
import { ExampleRepository } from '@/database/repositories/example.repository';

const MODULE = 'prisma';

const DatabaseModule =
  MODULE === 'prisma' ? PrismaDatabaseModule : TypeOrmDatabaseModule;

const OrmExampleRepository =
  MODULE === 'prisma' ? PrismaExampleRepository : TypeOrmExampleRepository;

@Module({
  imports: [DatabaseModule],
  controllers: [ExampleController],
  providers: [
    ExampleService,
    {
      provide: ExampleRepository,
      useClass: OrmExampleRepository,
    },
  ],
})
export class ExampleModule {}
