DROP TABLE IF EXISTS college;

CREATE TABLE college (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    averageSat FLOAT,
    averageEarningsSixYearsAfterEntry FLOAT,
    completionRate FLOAT,
    admissionRate FLOAT
);

INSERT INTO college
    (name, averageSat, averageEarningsSixYearsAfterEntry, completionRate, admissionRate)
VALUES
    ('SUPER GOOD COLLEGE', 1600, 1000000, 1, 0.0001);
INSERT INTO college
    (name, averageSat, averageEarningsSixYearsAfterEntry, completionRate, admissionRate)
VALUES
    ('TEST', 1700, 0, 1, 0.0001);
INSERT INTO college
    (name, averageSat, averageEarningsSixYearsAfterEntry, completionRate, admissionRate)
VALUES
    ('SUPER AVERAGE COLLEGE', 800, 10000, 0.5, 0.5);
INSERT INTO college
    (name, averageSat, averageEarningsSixYearsAfterEntry, completionRate, admissionRate)
VALUES
    ('SUPER BAD COLLEGE', 100, 100, 0, 0);