import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function findSchemaPath() {
  const visited = [];
  const starts = [currentDir];
  if (process.cwd() !== currentDir) starts.push(process.cwd());

  for (const start of starts) {
    let candidateRoot = start;
    let depth = 0;

    while (candidateRoot && depth < 8) {
      const candidate = path.resolve(candidateRoot, 'packages/prisma/schema.prisma');
      visited.push(candidate);
      if (existsSync(candidate)) {
        return { schemaPath: candidate, visited };
      }

      const parent = path.dirname(candidateRoot);
      if (parent === candidateRoot) break;
      candidateRoot = parent;
      depth += 1;
    }
  }

  return { schemaPath: null, visited };
}

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
    console.log('[Prisma] DIRECT_URL was missing but Supabase pooler URL detected. Using derived direct connection:',
      maskDatabaseUrl(derivedDirectUrl));
  }

  const directUrl = process.env.DIRECT_URL || derivedDirectUrl || databaseUrl;

  return {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
  };
}

function main() {
  const { schemaPath, visited } = findSchemaPath();
  if (!schemaPath) {
    console.error('[Prisma] Failed to locate schema.prisma. Checked paths:');
    visited.forEach((candidate) => console.error(` - ${candidate}`));
    process.exit(1);
  }

  const env = prepareEnv();
  console.log(`[Prisma] Using schema at: ${schemaPath}`);
  console.log(`[Prisma] process.cwd(): ${process.cwd()}`);
  console.log(`[Prisma] currentDir: ${currentDir}`);
  const migrateCmd = `pnpm --filter @solar-pm/prisma prisma migrate deploy --schema ${schemaPath}`;
  const statusCmd = `pnpm --filter @solar-pm/prisma prisma migrate status --schema ${schemaPath}`;
  const generateCmd = `pnpm --filter @solar-pm/prisma prisma generate --schema ${schemaPath}`;

  runCommand(generateCmd, env);
  runCommand(migrateCmd, env);
  runCommand(statusCmd, env);
}

main();