CREATE TABLE contacts(
  id serial PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number char(10) UNIQUE NOT NULL
);

CREATE TABLE groups(
  id serial PRIMARY KEY,
  group_name text UNIQUE NOT NULL
);

CREATE TABLE contacts_groups(
  id serial PRIMARY KEY,
  contact_id integer NOT NULL REFERENCES contacts(id),
  group_id integer NOT NULL REFERENCES groups(id)
);