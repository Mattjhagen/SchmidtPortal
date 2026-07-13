-- Optional seed data for local testing.
-- Run AFTER the init migration, and AFTER you've created an employee auth user.
-- Replace <EMPLOYEE_UUID> with your auth user's id (from Supabase Auth > Users),
-- then set their profile role to 'employee'.

-- 1) promote your user to employee:
-- update profiles set role='employee', full_name='Matt Schmidt' where id='<EMPLOYEE_UUID>';

-- 2) sample customer + job:
insert into customers (full_name, company, email, phone, city, zip, created_by)
values ('Jane Doe', 'Doe Residence', 'customer@example.com', '402-555-0142', 'Omaha', '68154',
        '<EMPLOYEE_UUID>')
returning id;
-- copy the returned customer id into <CUSTOMER_UUID> below

-- insert into jobs (customer_id, name, site_address, created_by)
-- values ('<CUSTOMER_UUID>', 'Backyard Retaining Wall', '123 Maple St, Omaha NE', '<EMPLOYEE_UUID>');
