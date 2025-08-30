import sql from 'mssql';

const sqlConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER || 'localhost',
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: process.env.NODE_ENV === 'production', // Use encryption for production
    trustServerCertificate: true, // Change to false for production with a valid certificate
  },
};

let pool: sql.ConnectionPool;

export const getDbPool = async (): Promise<sql.ConnectionPool> => {
  if (!pool) {
    try {
      pool = await sql.connect(sqlConfig);
      console.log('Connected to SQL Server');
    } catch (err) {
      console.error('Database Connection Failed! Bad Config: ', err);
      throw err;
    }
  }
  return pool;
};
