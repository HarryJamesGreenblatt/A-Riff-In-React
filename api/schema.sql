-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ARiffInReact')
BEGIN
    CREATE DATABASE ARiffInReact;
END
GO

USE ARiffInReact;
GO

-- Create Users table with JWT authentication fields
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) NOT NULL UNIQUE,
        passwordHash NVARCHAR(255) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'member',
        emailVerified BIT NOT NULL DEFAULT 0,
        createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
ELSE
BEGIN
    -- Migration: Add new columns if table exists but doesn't have them
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'passwordHash')
    BEGIN
        ALTER TABLE Users ADD passwordHash NVARCHAR(255) NULL;
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'name')
    BEGIN
        ALTER TABLE Users ADD name NVARCHAR(255) NULL;
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'role')
    BEGIN
        ALTER TABLE Users ADD role NVARCHAR(50) NOT NULL DEFAULT 'member';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'emailVerified')
    BEGIN
        ALTER TABLE Users ADD emailVerified BIT NOT NULL DEFAULT 0;
    END
END
GO

-- Create UserPreferences table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserPreferences')
BEGIN
    CREATE TABLE UserPreferences (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        userId UNIQUEIDENTIFIER NOT NULL,
        preferenceName NVARCHAR(100) NOT NULL,
        preferenceValue NVARCHAR(MAX),
        createdAt DATETIME NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_UserPreferences_Users FOREIGN KEY (userId)
            REFERENCES Users(id) ON DELETE CASCADE
    );
END
GO

-- Create index on Users.email
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email')
BEGIN
    CREATE UNIQUE INDEX IX_Users_Email ON Users(email);
END
GO

-- Note: For existing users without passwordHash, you may want to:
-- 1. Set a temporary password hash
-- 2. Force password reset on first login
-- 3. Or migrate users to the new authentication system
