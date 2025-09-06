"use strict";

const sql = require('mssql');

let connectionString;
let sqlAvailable = false;

try {
    connectionString = process.env.AZURE_SQL_CONNECTIONSTRING;
    if (!connectionString) {
        console.error('AZURE_SQL_CONNECTIONSTRING environment variable not set');
        // Don't throw - allow graceful degradation
    } else {
        sqlAvailable = true;
        console.log('SQL connection string found');
    }
} catch (error) {
    console.error('Error accessing environment variables:', error);
    // Don't throw - allow graceful degradation
}

let pool;
/**
 * Gets a connection pool to the SQL database
 * @returns {Promise} A connection pool
 */
function getDbPool() {
    if (!connectionString) {
        console.error('SQL database not available - no connection string');
        return Promise.reject(new Error('SQL_DATABASE_UNAVAILABLE'));
    }
    
    if (!pool) {
        return sql.connect(connectionString)
            .then(function(newPool) {
                pool = newPool;
                console.log('Connected to SQL Server successfully');
                return pool;
            })
            .catch(function(err) {
                console.error('Database Connection Failed! Bad Config: ', err);
                sqlAvailable = false;
                return Promise.reject(new Error('SQL_CONNECTION_FAILED'));
            });
    }
    return Promise.resolve(pool);
}

module.exports = { getDbPool };
