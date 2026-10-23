-- CASELINK AI reference data.
-- State/UT names are sourced from https://www.india.gov.in/directory/web-directory/state-uts.
-- District rows should be imported from https://igod.gov.in/sg/district/states
-- using the same stable state IDs. The source date is intentionally recorded.

insert into administrative_states (id, name, kind, source_url, source_updated_at) values
('IN-AP', 'Andhra Pradesh', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-AR', 'Arunachal Pradesh', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-AS', 'Assam', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-BR', 'Bihar', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-CT', 'Chhattisgarh', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-GA', 'Goa', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-GJ', 'Gujarat', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-HR', 'Haryana', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-HP', 'Himachal Pradesh', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-JH', 'Jharkhand', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-KA', 'Karnataka', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-KL', 'Kerala', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-MP', 'Madhya Pradesh', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-MH', 'Maharashtra', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-MN', 'Manipur', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-ML', 'Meghalaya', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-MZ', 'Mizoram', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-NL', 'Nagaland', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-OD', 'Odisha', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-PB', 'Punjab', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-RJ', 'Rajasthan', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-SK', 'Sikkim', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-TN', 'Tamil Nadu', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-TG', 'Telangana', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-TR', 'Tripura', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-UP', 'Uttar Pradesh', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-UK', 'Uttarakhand', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-WB', 'West Bengal', 'state', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-AN', 'Andaman and Nicobar Islands', 'union_territory', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-CH', 'Chandigarh', 'union_territory', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-DH', 'Dadra and Nagar Haveli and Daman and Diu', 'union_territory', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-DL', 'Delhi', 'union_territory', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-JK', 'Jammu and Kashmir', 'union_territory', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-LA', 'Ladakh', 'union_territory', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-LD', 'Lakshadweep', 'union_territory', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date),
('IN-PY', 'Puducherry', 'union_territory', 'https://www.india.gov.in/directory/web-directory/state-uts', current_date)
on conflict (id) do update set name = excluded.name, kind = excluded.kind, source_updated_at = excluded.source_updated_at;

-- Example district import row. Replace/extend with the maintained IGOD export.
insert into administrative_districts (id, state_id, name, source_url, source_updated_at)
values ('IN-MH-PUN', 'IN-MH', 'Pune', 'https://igod.gov.in/sg/district/states', current_date)
on conflict (id) do update set name = excluded.name, source_updated_at = excluded.source_updated_at;
