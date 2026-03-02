USE score_management;

UPDATE admins SET password = '$2a$10$sBhLa4hBLQXXVtbAqRNcVODXnrSeTaCcxUpzNPudBq1MzmbtwIvUi' WHERE username = 'admin';

SELECT id, username, password FROM admins;
