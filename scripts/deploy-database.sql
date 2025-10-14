-- ===========================================================================
-- Database Deployment Script for JWT Authentication
-- This script is idempotent and safe to run multiple times
-- ===========================================================================

PRINT '========================================';
PRINT 'Starting Database Setup';
PRINT '========================================';
PRINT '';

-- ---------------------------------------------------------------------------
-- Step 1: Create or Update Users Table
-- ---------------------------------------------------------------------------
PRINT 'Step 1: Users Table Setup';
PRINT '-----------------------------------------';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    PRINT '  Creating Users table...';
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL UNIQUE,
        passwordHash NVARCHAR(255) NULL,
        name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'member',
        phone NVARCHAR(20) NULL,
        createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT '  ? Users table created';
END
ELSE
BEGIN
    PRINT '  Users table exists, checking schema...';
    
    -- Add passwordHash column if missing (migration from MSAL)
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'passwordHash')
    BEGIN
        PRINT '  Adding passwordHash column...';
        ALTER TABLE Users ADD passwordHash NVARCHAR(255) NULL;
        PRINT '  ? passwordHash column added';
    END
    
    -- Add name column if missing (migration from firstName/lastName)
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'name')
    BEGIN
        PRINT '  Adding name column...';
        ALTER TABLE Users ADD name NVARCHAR(255) NULL;
        PRINT '  ? name column added';
    END
    
    -- Add role column if missing
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'role')
    BEGIN
        PRINT '  Adding role column...';
        ALTER TABLE Users ADD role NVARCHAR(50) NOT NULL DEFAULT 'member';
        PRINT '  ? role column added';
    END
    
    -- Add phone column if missing
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'phone')
    BEGIN
        PRINT '  Adding phone column...';
        ALTER TABLE Users ADD phone NVARCHAR(20) NULL;
        PRINT '  ? phone column added';
    END
    
    PRINT '  ? Schema check complete';
END

PRINT '';
PRINT '========================================';
PRINT '? Database Setup Complete!';
PRINT '========================================';
GO
