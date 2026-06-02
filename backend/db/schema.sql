DROP DATABASE IF EXISTS lock_in_db;
CREATE DATABASE lock_in_db;
USE lock_in_db;

CREATE TABLE Users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  department VARCHAR(50),
  reputation_score INT DEFAULT 0
);

CREATE TABLE Category (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  category_name VARCHAR(50) NOT NULL
);

CREATE TABLE Mission (
  mission_id INT PRIMARY KEY AUTO_INCREMENT,
  mission_title VARCHAR(100) NOT NULL,
  mission_time DATETIME NOT NULL,
  location VARCHAR(100),
  category_id INT,
  created_by INT,
  FOREIGN KEY (category_id) REFERENCES Category(category_id),
  FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

CREATE TABLE Skill (
  skill_id INT PRIMARY KEY AUTO_INCREMENT,
  skill_name VARCHAR(50) NOT NULL,
  verification_source VARCHAR(50)
);

CREATE TABLE Participation (
  participation_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  mission_id INT,
  status VARCHAR(20) NOT NULL,
  showed_up BOOLEAN DEFAULT NULL,
  UNIQUE KEY unique_user_mission (user_id, mission_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (mission_id) REFERENCES Mission(mission_id)
);

CREATE TABLE Messages (
  message_id INT PRIMARY KEY AUTO_INCREMENT,
  mission_id INT,
  sender_id INT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES Mission(mission_id),
  FOREIGN KEY (sender_id) REFERENCES Users(user_id)
);

CREATE VIEW CompletedUsers AS
SELECT U.name, M.mission_title
FROM Users U
JOIN Participation P ON U.user_id = P.user_id
JOIN Mission M ON P.mission_id = M.mission_id
WHERE P.status = 'Completed';

DELIMITER $$

CREATE PROCEDURE safeInsert()
BEGIN
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  SELECT 'Error occurred' AS message;

  INSERT INTO Users (user_id, name, email, department, reputation_score)
  VALUES (1, 'Duplicate', 'dup@gmail.com', 'CSE', 0);
END $$

CREATE FUNCTION safeCount(uid INT)
RETURNS INT
DETERMINISTIC
BEGIN
  DECLARE total INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  SET total = -1;

  SELECT COUNT(*) INTO total
  FROM Participation
  WHERE user_id = uid;

  RETURN total;
END $$

CREATE TRIGGER updateReputation
AFTER UPDATE ON Participation
FOR EACH ROW
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    UPDATE Users
    SET reputation_score = reputation_score + 10
    WHERE user_id = NEW.user_id;
  END IF;
END $$

CREATE PROCEDURE showUsers()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE uname VARCHAR(50);
  DECLARE user_cursor CURSOR FOR SELECT name FROM Users;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN user_cursor;

  read_loop: LOOP
    FETCH user_cursor INTO uname;
    IF done THEN
      LEAVE read_loop;
    END IF;
    SELECT uname;
  END LOOP;

  CLOSE user_cursor;
END $$

DELIMITER ;
