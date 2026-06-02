-- PostgreSQL Schema for Lock-In Database

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS updateReputation ON participation;
DROP FUNCTION IF EXISTS updateReputationFunction();
DROP FUNCTION IF EXISTS safeCount(INT);
DROP PROCEDURE IF EXISTS showUsers();
DROP VIEW IF EXISTS "CompletedUsers";
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS participation;
DROP TABLE IF EXISTS mission;
DROP TABLE IF EXISTS skill;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS users;

-- Create Tables
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  department VARCHAR(50),
  reputation_score INT DEFAULT 0
);

CREATE TABLE category (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL
);

CREATE TABLE mission (
  mission_id SERIAL PRIMARY KEY,
  mission_title VARCHAR(100) NOT NULL,
  mission_time TIMESTAMP NOT NULL,
  location VARCHAR(100),
  category_id INT REFERENCES category(category_id) ON DELETE CASCADE,
  created_by INT REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE skill (
  skill_id SERIAL PRIMARY KEY,
  skill_name VARCHAR(50) NOT NULL,
  verification_source VARCHAR(50)
);

CREATE TABLE participation (
  participation_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  mission_id INT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  showed_up BOOLEAN DEFAULT NULL,
  UNIQUE(user_id, mission_id)
);

CREATE TABLE messages (
  message_id SERIAL PRIMARY KEY,
  mission_id INT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  sender_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create View
CREATE VIEW "CompletedUsers" AS
SELECT U.name, M.mission_title
FROM users U
JOIN participation P ON U.user_id = P.user_id
JOIN mission M ON P.mission_id = M.mission_id
WHERE P.status = 'Completed';

-- Create Function for updating reputation
CREATE OR REPLACE FUNCTION updateReputationFunction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    UPDATE users
    SET reputation_score = reputation_score + 10
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
CREATE TRIGGER updateReputation
AFTER UPDATE ON participation
FOR EACH ROW
EXECUTE FUNCTION updateReputationFunction();

-- Create Function: safeCount
CREATE OR REPLACE FUNCTION safeCount(uid INT)
RETURNS INT AS $$
DECLARE
  total INT DEFAULT 0;
BEGIN
  SELECT COUNT(*) INTO total
  FROM participation
  WHERE user_id = uid;
  RETURN total;
EXCEPTION WHEN OTHERS THEN
  RETURN -1;
END;
$$ LANGUAGE plpgsql;

-- Create Procedure: showUsers
CREATE OR REPLACE PROCEDURE showUsers()
LANGUAGE plpgsql
AS $$
DECLARE
  uname VARCHAR(50);
  user_cursor CURSOR FOR SELECT name FROM users;
BEGIN
  OPEN user_cursor;
  LOOP
    FETCH user_cursor INTO uname;
    EXIT WHEN NOT FOUND;
    RAISE NOTICE 'User: %', uname;
  END LOOP;
  CLOSE user_cursor;
END;
$$;
