INSERT INTO contacts (first_name, last_name, phone_number) VALUES
('Benjamin', 'Stevens', '9839019842'),
('Jonathan', 'Whitaker', '3249784765'),
('Dubello', 'Ell', '6170234911'),
('Sun', 'Wu''Kong', '6628920100'),
('Vincent', 'van Gogh', '1098827674');

INSERT INTO groups (group_name) VALUES
('Family'),
('Friends'),
('Work');

INSERT INTO contacts_groups(contact_id, group_id) VALUES
(1, 2),
(1, 3),
(2, 3),
(3, 2),
(4, 2);