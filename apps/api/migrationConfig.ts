import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

/**
 * TypeORM CLI 전용 DataSource.
 * dev: direnv가 미리 export한 env 사용.
 * entity/migration 경로는 컴파일된 dist 의 .js 파일을 가리킴.
 * (ts-node 가 typeorm 0.3.x 의 decorator emit 과 충돌하기 때문에 dist 사용)
 *
 * 사용 순서:
 *   pnpm build               # dist 생성
 *   pnpm migration:generate <Name>
 *   pnpm migration:run
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_DB_HOST ?? 'localhost',
  port: 5432,
  username: process.env.POSTGRES_DB_USERNAME ?? 'root',
  password: process.env.POSTGRES_DB_PASSWORD ?? 'root1234',
  database: process.env.POSTGRES_DB_NAME ?? 'yakirim',
  namingStrategy: new SnakeNamingStrategy(),
  entities: ['dist/src/database/entities/*.entity.js', 'dist/src/module/**/*.entity.js'],
  migrations: ['dist/src/database/migration/*.js'],
  synchronize: false,
});
