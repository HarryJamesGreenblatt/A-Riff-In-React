import { DefaultAzureCredential } from '@azure/identity';
import * as mssql from 'mssql';

// Types
interface User {
  id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class SqlService {
  private connectionPool: Promise<mssql.ConnectionPool> | null = null;
  private config: mssql.config;

  constructor() {
    // Use DefaultAzureCredential for Managed Identity in production
    const useAzureAuth = process.env.NODE_ENV === 'production';
    
    this.config = {
      server: process.env.SQL_SERVER || 'localhost',
      database: process.env.SQL_DATABASE || 'ARiffInReact',
      options: {
        encrypt: true,
        trustServerCertificate: process.env.NODE_ENV !== 'production'
      }
    };
    
    // In production, use Managed Identity
    if (useAzureAuth) {
      this.config.authentication = {
        type: 'azure-active-directory-default',
        options: {
          clientId: process.env.AZURE_CLIENT_ID
        }
      };
    } else {
      // For local development, use SQL authentication
      this.config.user = process.env.SQL_USER;
      this.config.password = process.env.SQL_PASSWORD;
    }
  }

  private async getConnection(): Promise<mssql.ConnectionPool> {
    try {
      if (!this.connectionPool) {
        this.connectionPool = mssql.connect(this.config);
      }
      return this.connectionPool;
    } catch (error) {
      console.error('Failed to connect to SQL Database:', error);
      throw new Error('Database connection error');
    }
  }

  async getUsers(): Promise<User[]> {
    const pool = await this.getConnection();
    const result = await pool.request().query('SELECT * FROM Users');
    return result.recordset;
  }

  async getUserById(id: string): Promise<User | null> {
    const pool = await this.getConnection();
    const result = await pool.request()
      .input('id', mssql.VarChar, id)
      .query('SELECT * FROM Users WHERE id = @id');
    
    return result.recordset[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const pool = await this.getConnection();
    const result = await pool.request()
      .input('email', mssql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    return result.recordset[0] || null;
  }

  async createUser(user: User): Promise<User> {
    const pool = await this.getConnection();
    // Check if user already exists
    const existingUser = await this.getUserByEmail(user.email);
    if (existingUser) {
      return existingUser;
    }
    const result = await pool.request()
      .input('firstName', mssql.VarChar, user.firstName)
      .input('lastName', mssql.VarChar, user.lastName)
      .input('phone', mssql.VarChar, user.phone || null)
      .input('email', mssql.VarChar, user.email)
      .query(`
        INSERT INTO Users (firstName, lastName, phone, email, createdAt, updatedAt)
        OUTPUT INSERTED.*
        VALUES (@firstName, @lastName, @phone, @email, GETDATE(), GETDATE())
      `);
    return result.recordset[0];
  }
}

export const sqlService = new SqlService();
