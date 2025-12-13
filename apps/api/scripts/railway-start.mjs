import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const schemaPath = path.resolve(repoRoot, 'packages/prisma/schema.prisma');
const apiEntry = path.resolve(repoRoot, 'dist/apps/api/src/main.js');

const prisma = new PrismaClient();

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

async function checkNotificationColumn() {
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

function runCommand(cmd) {
  console.log(`[Prisma] Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

async function main() {
  const maskedDb = maskDatabaseUrl(process.env.DATABASE_URL);
  console.log(`[Prisma] DATABASE_URL target: ${maskedDb}`);

  if (!process.env.DATABASE_URL) {
    console.error('[Prisma] DATABASE_URL is not set. Exiting.');
    process.exit(1);
  }

  const existsBefore = await checkNotificationColumn();

  try {
    runCommand(`cd ${repoRoot} && pnpm --filter @solar-pm/prisma prisma generate --schema ${schemaPath}`);
    runCommand(`cd ${repoRoot} && pnpm --filter @solar-pm/prisma prisma migrate deploy --schema ${schemaPath}`);
  } catch (error) {
    console.error('[Prisma] migrate deploy failed. API will not start.', error);
    await prisma.$disconnect();
    process.exit(1);
  }

  const existsAfter = await checkNotificationColumn();
  if (!existsBefore || !existsAfter) {
    console.log('[Prisma] Column state before/after migrate:', {
      before: existsBefore,
      after: existsAfter,
    });
  }

  await prisma.$disconnect();

  console.log('[API] Starting Nest application...');
  runCommand(`node ${apiEntry}`);
}

main().catch(async (error) => {
  console.error('[Prisma] Startup script failed', error);
  await prisma.$disconnect();
  process.exit(1);
});
