INSERT INTO contacts (first_name, last_name, phone_number, username) VALUES
('Benjamin', 'Stevens', '9839019842', 'admin'),
('Jonathan', 'Whitaker', '3249784765', 'admin'),
('Dubello', 'Ell', '6170234911', 'admin'),
('Sun', 'Wu''Kong', '6628920100', 'ruler'),
('Vincent', 'van Gogh', '1098827674', 'ruler');

INSERT INTO groups (group_name, username) VALUES
('Family', 'admin'),
('Friends', 'admin'),
('Work', 'admin'),
('Family', 'ruler'),
('Friends', 'ruler'),
('Work', 'ruler'),
('Family', 'geribald'),
('Friends', 'geribald'),
('Work', 'geribald');

INSERT INTO contacts_groups(contact_id, group_id) VALUES
(1, 2),
(1, 3),
(2, 3),
(3, 2),
(4, 2);