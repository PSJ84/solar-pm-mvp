import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const schemaPath = path.resolve(repoRoot, 'packages/prisma/schema.prisma');
const apiEntry = path.resolve(repoRoot, 'dist/apps/api/src/main.js');
let prisma;

function maskDatabaseUrl(raw) {
  if (!raw) return 'DATABASE_URL not set';
  try {
    const url = new URL(raw);
    const dbName = url.pathname?.replace('/', '') || '';
    const hostPort = url.port ? `${url.hostname}:${url.port}` : url.hostname;
    return `${url.protocol}//***@${hostPort}/${dbName}`;
  } catch {
    return 'DATABASE_URL malformed';
  }
}

function deriveSupabaseDirectUrl(databaseUrl) {
  if (!databaseUrl) return null;
  try {
    const parsed = new URL(databaseUrl);
    const isPoolerHost = parsed.hostname.includes('.pooler.supabase.com');
    if (!isPoolerHost) return null;

    const directHost = parsed.hostname.replace('.pooler.supabase.com', '.supabase.co');
    const directPort = parsed.port === '6543' ? '5432' : parsed.port || '5432';
    parsed.hostname = directHost;
    parsed.port = directPort;
    return parsed.toString();
  } catch (error) {
    console.error('[Prisma] Failed to derive DIRECT_URL from DATABASE_URL', error);
    return null;
  }
}

async function checkNotificationColumn(prisma) {
  try {
    const rows = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='tasks' AND column_name='notificationEnabled';`;
    const exists = Array.isArray(rows) && rows.length > 0;
    console.log(`[Prisma] Column tasks.notificationEnabled exists? ${exists}`);
    return exists;
  } catch (error) {
    console.error('[Prisma] Column existence check failed', error);
    return false;
  }
}

function runCommand(cmd, env) {
  console.log(`[Prisma] Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env });
}

function prepareEnv() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[Prisma] DATABASE_URL is not set. Exiting.');
    process.exit(1);
  }

  const maskedDb = maskDatabaseUrl(databaseUrl);
  console.log(`[Prisma] DATABASE_URL target: ${maskedDb}`);

  const derivedDirectUrl = !process.env.DIRECT_URL ? deriveSupabaseDirectUrl(databaseUrl) : null;
  if (derivedDirectUrl) {
    console.log(
      '[Prisma] DIRECT_URL missing; using Supabase direct connection derived from pooler:',
      maskDatabaseUrl(derivedDirectUrl),
    );
  }

  const directUrl = process.env.DIRECT_URL || derivedDirectUrl || databaseUrl;
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
  };

  process.env.DIRECT_URL = directUrl;

  console.log(`[Prisma] DIRECT_URL for migrate deploy: ${maskDatabaseUrl(directUrl)}`);
  return env;
}

async function main() {
  const env = prepareEnv();
  prisma = new PrismaClient();

  const existsBefore = await checkNotificationColumn(prisma);

  try {
    runCommand(`cd ${repoRoot} && pnpm --filter @solar-pm/prisma prisma generate --schema ${schemaPath}`, env);
    runCommand(`cd ${repoRoot} && pnpm --filter @solar-pm/prisma prisma migrate deploy --schema ${schemaPath}`, env);
  } catch (error) {
    console.error('[Prisma] migrate deploy failed. API will not start.', error);
    await prisma.$disconnect();
    process.exit(1);
  }

  const existsAfter = await checkNotificationColumn(prisma);
  if (!existsBefore || !existsAfter) {
    console.log('[Prisma] Column state before/after migrate:', {
      before: existsBefore,
      after: existsAfter,
    });
  }

  await prisma.$disconnect();

  console.log('[API] Starting Nest application...');
  runCommand(`node ${apiEntry}`, env);
}

main().catch(async (error) => {
  console.error('[Prisma] Startup script failed', error);
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(1);
});
