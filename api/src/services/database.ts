import sql from 'mssql';

const connectionString = process.env.AZURE_SQL_CONNECTIONSTRING;

if (!connectionString) {
  throw new Error('AZURE_SQL_CONNECTIONSTRING environment variable not set');
}

let pool: sql.ConnectionPool;

export const getDbPool = async (): Promise<sql.ConnectionPool> => {
  if (!pool) {
    try {
      pool = await sql.connect(connectionString);
      console.log('Connected to SQL Server');
    } catch (err) {
      console.error('Database Connection Failed! Bad Config: ', err);
      throw err;
    }
  }
  return pool;
};
