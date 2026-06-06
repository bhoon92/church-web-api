import fs from 'fs';
import path from 'path';

/**
 * direnv / shell 에 이미 export 된 환경변수를 .env 파일로 덤프.
 * (TypeORM CLI 가 dotenv 로 읽기 위한 brige. localdev 에선 비어있어도 동작함.)
 */
const KEYS = [
  'NODE_ENV',
  'POSTGRES_DB_HOST',
  'POSTGRES_DB_HOST_RO',
  'POSTGRES_DB_USERNAME',
  'POSTGRES_DB_PASSWORD',
  'POSTGRES_DB_NAME',
  'JWT_CMS_ACCESS_SECRET_KEY',
  'JWT_CMS_REFRESH_SECRET_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

const lines = KEYS.filter(k => process.env[k] !== undefined).map(k => `${k}=${process.env[k]}`);

const outPath = path.resolve(__dirname, '..', '.env');
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`[generateEnv] wrote ${lines.length} entries to ${outPath}`);
