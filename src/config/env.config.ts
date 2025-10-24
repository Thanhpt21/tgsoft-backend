import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env';
const envPath = path.resolve(process.cwd(), envFile);

dotenv.config({ path: envPath });

console.log(`📂 Loading env from: ${envFile}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);