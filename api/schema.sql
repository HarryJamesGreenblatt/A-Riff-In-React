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
        phone NVARCHAR(20) NULL,
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

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'phone')
    BEGIN
        ALTER TABLE Users ADD phone NVARCHAR(20) NULL;
    END
END
GO

-- Create or migrate UserPreferences table
-- This section adapts to the Users.id column type (INT or UNIQUEIDENTIFIER)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserPreferences')
BEGIN
    DECLARE @usersIdType NVARCHAR(50);
    SELECT @usersIdType = TYPE_NAME(system_type_id)
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Users') AND name = 'id';

    IF @usersIdType IS NULL
    BEGIN
        -- Fallback: assume UNIQUEIDENTIFIER
        SET @usersIdType = 'uniqueidentifier';
    END

    DECLARE @createSql NVARCHAR(MAX);

    IF LOWER(@usersIdType) = 'int'
    BEGIN
        SET @createSql = N'
        CREATE TABLE UserPreferences (
            id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
            userId INT NOT NULL,
            preferenceName NVARCHAR(100) NOT NULL,
            preferenceValue NVARCHAR(MAX),
            createdAt DATETIME NOT NULL DEFAULT GETDATE(),
            updatedAt DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT FK_UserPreferences_Users FOREIGN KEY (userId)
                REFERENCES Users(id) ON DELETE CASCADE
        );';
    END
    ELSE
    BEGIN
        SET @createSql = N'
        CREATE TABLE UserPreferences (
            id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
            userId UNIQUEIDENTIFIER NOT NULL,
            preferenceName NVARCHAR(100) NOT NULL,
            preferenceValue NVARCHAR(MAX),
            createdAt DATETIME NOT NULL DEFAULT GETDATE(),
            updatedAt DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT FK_UserPreferences_Users FOREIGN KEY (userId)
                REFERENCES Users(id) ON DELETE CASCADE
        );';
    END

    EXEC sp_executesql @createSql;
END
ELSE
BEGIN
    -- Migration: ensure userId column exists and matches Users.id type
    DECLARE @usersIdType2 NVARCHAR(50);
    SELECT @usersIdType2 = TYPE_NAME(system_type_id)
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Users') AND name = 'id';

    IF @usersIdType2 IS NULL
        SET @usersIdType2 = 'uniqueidentifier';

    -- Check if userId column exists
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('UserPreferences') AND name = 'userId')
    BEGIN
        IF LOWER(@usersIdType2) = 'int'
        BEGIN
            ALTER TABLE UserPreferences ADD userId INT NOT NULL DEFAULT 0;
            -- Note: default 0 may not match real users; consider manual migration if needed
        END
        ELSE
        BEGIN
            ALTER TABLE UserPreferences ADD userId UNIQUEIDENTIFIER NULL;
        END
    END
    ELSE
    BEGIN
        -- If column exists but type mismatches, log comment (manual intervention may be required)
        DECLARE @prefUserIdType NVARCHAR(50);
        SELECT @prefUserIdType = TYPE_NAME(system_type_id)
        FROM sys.columns
        WHERE object_id = OBJECT_ID('UserPreferences') AND name = 'userId';

        IF @prefUserIdType IS NOT NULL AND LOWER(@prefUserIdType) <> LOWER(@usersIdType2)
        BEGIN
            -- Do not attempt automatic destructive conversion; surface a message via RAISERROR with severity 10 (informational)
            DECLARE @msg NVARCHAR(400) = 'UserPreferences.userId type ('''+@prefUserIdType+''') does not match Users.id type ('''+@usersIdType2+'''). Manual migration may be required.';
            RAISERROR(@msg, 10, 1) WITH NOWAIT;
        END
    END
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
