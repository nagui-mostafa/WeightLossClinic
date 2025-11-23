import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL not set');
}

(async () => {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const res = await client.query('SELECT NOW()');
  console.log(res.rows[0]);
  await client.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
