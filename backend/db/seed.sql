USE lock_in_db;

INSERT INTO Category (category_id, category_name) VALUES
(1, 'Coding'),
(2, 'Sports');

INSERT INTO Skill (skill_id, skill_name, verification_source) VALUES
(1, 'JavaScript', 'GitHub'),
(2, 'React', 'Project Portfolio'),
(3, 'MySQL', 'DBMS Lab'),
(4, 'Node.js', 'GitHub'),
(5, 'UI Design', 'Portfolio');

INSERT INTO Users (user_id, name, email, department, reputation_score) VALUES
(101, 'Faheem', 'faheem@srmist.edu.in', 'Networking and Communications', 80),
(102, 'Rayaan', 'rayaan@srmist.edu.in', 'Networking and Communications', 90),
(103, 'Aarav Mehta', 'aarav@srmist.edu.in', 'Computer Science Engineering', 40),
(104, 'Maya Rao', 'maya@srmist.edu.in', 'Information Technology', 55),
(105, 'Kabir Sethi', 'kabir@srmist.edu.in', 'Computer Science Engineering', 15),
(106, 'Ira Thomas', 'ira@srmist.edu.in', 'Electronics and Communication', 25),
(107, 'Dev Nair', 'dev@srmist.edu.in', 'Computer Science Engineering', 70),
(108, 'Nisha Khan', 'nisha@srmist.edu.in', 'Data Science', 80),
(109, 'Rohan Das', 'rohan@srmist.edu.in', 'Artificial Intelligence', 35),
(110, 'Tara Iyer', 'tara@srmist.edu.in', 'Data Science', 45);

INSERT INTO Mission (mission_id, mission_title, mission_time, location, category_id, created_by) VALUES
(201, 'Hackathon Grind', DATE_ADD(NOW(), INTERVAL 4 HOUR), 'SRM KTR Library', 1, 101),
(202, 'LeetCode Lock-In', DATE_ADD(NOW(), INTERVAL 7 HOUR), 'SRM KTR Tech Park', 1, 102),
(203, 'API Battle Test', DATE_ADD(NOW(), INTERVAL 1 DAY), 'SRM KTR Computer Lab 2', 1, 103),
(204, 'Pitch Deck Build', DATE_ADD(NOW(), INTERVAL 1 DAY), 'SRM KTR Seminar Hall', 1, 104),
(205, 'Database Schema Jam', DATE_ADD(NOW(), INTERVAL 2 DAY), 'SRM KTR DBMS Lab', 1, 105),
(206, 'Open Source Fix Run', DATE_ADD(NOW(), INTERVAL 2 DAY), 'SRM KTR Innovation Centre', 1, 106),
(207, 'DSA Mock Duel', DATE_ADD(NOW(), INTERVAL 3 DAY), 'SRM KTR Block C', 1, 107),
(208, 'Frontend Polish Night', DATE_ADD(NOW(), INTERVAL 3 DAY), 'SRM KTR Design Studio', 1, 108),
(209, 'Backend Deploy Squad', DATE_ADD(NOW(), INTERVAL 4 DAY), 'SRM KTR Networking Lab', 1, 109),
(210, 'Final Demo Rehearsal', DATE_ADD(NOW(), INTERVAL 5 DAY), 'SRM KTR Auditorium Lobby', 1, 110);

INSERT INTO Participation (participation_id, user_id, mission_id, status, showed_up) VALUES
(301, 102, 201, 'Completed', TRUE),
(302, 101, 202, 'Pending', NULL),
(303, 107, 203, 'Completed', TRUE),
(304, 108, 204, 'Missed', FALSE);

INSERT INTO Messages (message_id, mission_id, sender_id, message) VALUES
(1, 201, 102, 'Locked in. I will bring the DBMS report queries.'),
(2, 202, 101, 'I am taking arrays and graphs first.');
