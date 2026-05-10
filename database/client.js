const sqliteDb = require('./db');
const { getPool, initSchema } = require('./postgres');

let activeProvider = 'sqlite';
let initialized = false;

function shouldUsePostgres() {
  return Boolean(process.env.DATABASE_URL) && process.env.FORCE_SQLITE !== 'true';
}

function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function normalizeSqlForPostgres(sql) {
  return sql
    .replace(/strftime\('%Y-%m',\s*([a-zA-Z0-9_.]+)\)/g, "to_char($1, 'YYYY-MM')")
    .replace(/\s+COLLATE\s+NOCASE/gi, '');
}

async function initDatabase() {
  if (initialized) {
    return;
  }

  if (shouldUsePostgres()) {
    try {
      await initSchema();
      const pool = getPool();
      await pool.query('SELECT 1');
      activeProvider = 'postgres';
      initialized = true;
      console.log('Database provider: PostgreSQL');
      return;
    } catch (error) {
      console.warn(`PostgreSQL unavailable, fallback to SQLite: ${error.message}`);
    }
  }

  sqliteDb.initDatabase();
  activeProvider = 'sqlite';
  initialized = true;
  console.log('Database provider: SQLite');
}

function getProvider() {
  return activeProvider;
}

async function exec(sql) {
  if (activeProvider === 'postgres') {
    const pool = getPool();
    await pool.query(sql);
    return;
  }

  sqliteDb.exec(sql);
}

async function all(sql, params = []) {
  if (activeProvider === 'postgres') {
    const pool = getPool();
    const converted = convertPlaceholders(normalizeSqlForPostgres(sql));
    const result = await pool.query(converted, params);
    return result.rows;
  }

  return sqliteDb.all(sql, params);
}

async function get(sql, params = []) {
  if (activeProvider === 'postgres') {
    const pool = getPool();
    const converted = convertPlaceholders(normalizeSqlForPostgres(sql));
    const result = await pool.query(converted, params);
    return result.rows[0] || null;
  }

  return sqliteDb.get(sql, params);
}

async function run(sql, params = []) {
  if (activeProvider === 'postgres') {
    const pool = getPool();
    const isInsert = /^\s*insert\s+/i.test(sql);
    const hasReturning = /\breturning\b/i.test(sql);
    const statement = isInsert && !hasReturning ? `${sql.trim()} RETURNING id` : sql;
    const converted = convertPlaceholders(normalizeSqlForPostgres(statement));
    const result = await pool.query(converted, params);

    return {
      changes: result.rowCount || 0,
      lastInsertRowid: result.rows[0]?.id || null
    };
  }

  const cleanSql = sql.replace(/\s+RETURNING\s+id\s*$/i, '');
  return sqliteDb.run(cleanSql, params);
}

module.exports = {
  initDatabase,
  getProvider,
  exec,
  run,
  get,
  all
};
