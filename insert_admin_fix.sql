USE score_management;

DELETE FROM admins;

INSERT INTO admins (username, password, real_name) 
VALUES ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ifxm6', 'Admin');

SELECT id, username, real_name FROM admins;
