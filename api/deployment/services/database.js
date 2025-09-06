"use strict";

const sql = require('mssql');

let connectionString;
try {
    connectionString = process.env.AZURE_SQL_CONNECTIONSTRING;
    if (!connectionString) {
        console.error('AZURE_SQL_CONNECTIONSTRING environment variable not set');
        // Don't throw - allow graceful degradation
    }
} catch (error) {
    console.error('Error accessing environment variables:', error);
    // Don't throw - allow graceful degradation
}

let pool;
/**
 * Gets a connection pool to the SQL database
 * @returns {Promise<sql.ConnectionPool>} A connection pool
 */
async function getDbPool() {
    if (!connectionString) {
        throw new Error('No connection string available for SQL database');
    }
    
    if (!pool) {
        try {
            pool = await sql.connect(connectionString);
            console.log('Connected to SQL Server');
        }
        catch (err) {
            console.error('Database Connection Failed! Bad Config: ', err);
            throw err;
        }
    }
    return pool;
}

module.exports = { getDbPool };
