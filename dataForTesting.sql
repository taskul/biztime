-- seed file with command
-- psql < data.sql

\c biztime_test

DROP TABLE IF EXISTS invoices
CASCADE;
DROP TABLE IF EXISTS companies
CASCADE;
DROP TABLE IF EXISTS industries
CASCADE;
DROP TABLE IF EXISTS comp_industries
CASCADE;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
  ind_code text PRIMARY KEY,
  ind_name text NOT NULL UNIQUE
);

CREATE TABLE comp_industries (
  c_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
  i_code text NOT NULL REFERENCES industries ON DELETE CASCADE,
  PRIMARY KEY(c_code, i_code)
);

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);

INSERT INTO industries (ind_code, ind_name)
  VALUES ('tech', 'Technology'),
        ('fin', 'Finance'),
        ('mnf', 'Manufacturing'),
        ('tel', 'Telecomuniations');

INSERT INTO comp_industries VALUES
        ('apple', 'tech'),
        ('apple', 'tel'),
        ('ibm', 'tech'),
        ('apple', 'mnf'),
        ('ibm', 'mnf');
