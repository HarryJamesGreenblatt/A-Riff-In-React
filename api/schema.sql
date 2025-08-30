-- Create Users table
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    role NVARCHAR(50) DEFAULT 'user',
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Create a trigger to update the updatedAt field on row update
CREATE TRIGGER trg_Users_Update
ON Users
AFTER UPDATE
AS
BEGIN
    UPDATE Users
    SET updatedAt = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END;
GO
