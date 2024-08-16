CREATE TABLE users(
  username text PRIMARY KEY,
  password text NOT NULL
);

CREATE TABLE contacts(
  id serial PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number char(10) NOT NULL,
  username text NOT NULL REFERENCES users(username) ON DELETE CASCADE
);

CREATE TABLE groups(
  id serial PRIMARY KEY,
  group_name text NOT NULL,
  username text NOT NULL REFERENCES users(username) ON DELETE CASCADE
);

CREATE TABLE contacts_groups(
  id serial PRIMARY KEY,
  contact_id integer NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  group_id integer NOT NULL REFERENCES groups(id) ON DELETE CASCADE
);
