-- Idempotent synthetic demonstration data for CASELINK AI.
-- Run supabase_schema.sql, reference_data.sql, then this file in Supabase SQL Editor.
-- These are not official AICTE records and contain no real complainant data.

insert into institutions (aicte_permanent_id, name, normalized_name, institution_type, state, district, address)
values
('DEMO-AICTE-0001', 'Northstar Institute of Technology', 'northstar institute of technology', 'Engineering College', 'Maharashtra', 'Pune', 'Synthetic address, Pune'),
('DEMO-AICTE-0002', 'Riverbend College of Engineering', 'riverbend college of engineering', 'Engineering College', 'Karnataka', 'Bengaluru Urban', 'Synthetic address, Bengaluru'),
('DEMO-AICTE-0003', 'Harborview School of Management', 'harborview school of management', 'Management Institute', 'Tamil Nadu', 'Chennai', 'Synthetic address, Chennai')
on conflict (aicte_permanent_id) do update set name = excluded.name, normalized_name = excluded.normalized_name,
institution_type = excluded.institution_type, state = excluded.state, district = excluded.district, address = excluded.address;

with demo_cases(reference, institution_key, category, subcategory, specific_issue, subject, description, bureau, status, priority, received_at, due_at, public_status) as (
  values
  ('CL-DEMO-RB-001', 'DEMO-AICTE-0001', 'Fees and Refunds', 'Caution deposit or security deposit not refunded', 'Refund pending after course completion',
   'Refundable caution deposit has not been returned', 'A former student reports that Northstar Institute of Technology has not returned the refundable caution deposit after course completion. The student contacted the accounts office twice and requests a written refund timeline.', 'RB', 'under_review', 'high', now() - interval '26 days', now() - interval '5 days', 'Under Review'),
  ('CL-DEMO-PGRC-001', 'DEMO-AICTE-0001', 'Fees and Refunds', 'Caution deposit or security deposit not refunded', 'Refund pending after course completion',
   'Students report unpaid caution deposits', 'Several students say their security deposits remain unpaid by Northstar Institute of Technology despite completing their programmes and submitting clearance forms. They request coordinated review of the refund process.', 'PGRC', 'received', 'high', now() - interval '18 days', now() + interval '12 days', 'Received'),
  ('CL-DEMO-EXAM-001', 'DEMO-AICTE-0002', 'Examination', 'Hall ticket or admit card not issued', 'Hall ticket not issued before examination',
   'Hall tickets were not issued before the examination', 'Students at Riverbend College of Engineering report that hall tickets were unavailable until the morning of the examination, preventing some students from entering the centre.', 'PGRC', 'escalated', 'critical', now() - interval '42 days', now() - interval '20 days', 'Escalated'),
  ('CL-DEMO-EXAM-002', 'DEMO-AICTE-0002', 'Examination', 'Results delayed', 'Results not published within expected period',
   'Examination results remain unpublished', 'Students at Riverbend College of Engineering report that the semester results have not been published within the expected period and that repeated requests have received no clear response.', 'RB', 'in_progress', 'medium', now() - interval '31 days', now() - interval '1 day', 'In Progress'),
  ('CL-DEMO-FEES-001', 'DEMO-AICTE-0003', 'Fees and Refunds', 'Admission fee refund pending', 'Refund pending after admission withdrawal',
   'Admission withdrawal refund remains pending', 'A student who withdrew admission from Harborview School of Management reports that the eligible fee refund remains pending after submitting the withdrawal request and bank details.', 'PGRC', 'awaiting_information', 'medium', now() - interval '12 days', now() + interval '18 days', 'Awaiting Information'),
  ('CL-DEMO-UNRELATED-001', 'DEMO-AICTE-0001', 'Infrastructure and Student Facilities', 'Library or laboratory access issue', 'Library access timing concern',
   'Library access hours are inconvenient', 'Students request longer library opening hours during project submission week. This is a facilities request and is unrelated to deposit refunds.', 'PGRC', 'received', 'low', now() - interval '7 days', now() + interval '23 days', 'Received'),
  ('CL-DEMO-UNRELATED-002', 'DEMO-AICTE-0003', 'Academic and Institutional Services', 'Faculty or academic support concern', 'Faculty availability concern',
   'Academic mentoring sessions are irregular', 'Students report that optional mentoring sessions are irregular and ask the institution to publish a timetable. No fee or examination issue is alleged.', 'RB', 'disposed', 'low', now() - interval '90 days', now() - interval '60 days', 'Disposed')
)
insert into cases (reference, institution_id, submitted_institution_name, submitted_institution_id, category, subcategory, specific_issue, state, district, subject, description, assigned_bureau, status, priority, received_at, due_at, public_status, closed_at, is_synthetic)
select d.reference, i.id, i.name, i.aicte_permanent_id, d.category, d.subcategory, d.specific_issue, i.state, i.district, d.subject, d.description, d.bureau, d.status, d.priority, d.received_at, d.due_at, d.public_status,
       case when d.status = 'disposed' then d.received_at + interval '15 days' end, true
from demo_cases d join institutions i on i.aicte_permanent_id = d.institution_key
on conflict (reference) do update set institution_id = excluded.institution_id, category = excluded.category, subcategory = excluded.subcategory,
specific_issue = excluded.specific_issue, state = excluded.state, district = excluded.district, subject = excluded.subject, description = excluded.description,
assigned_bureau = excluded.assigned_bureau, status = excluded.status, priority = excluded.priority, received_at = excluded.received_at, due_at = excluded.due_at,
public_status = excluded.public_status, closed_at = excluded.closed_at, is_synthetic = true;

insert into case_actions (case_id, action_type, description, previous_status, new_status, visibility)
select c.id, 'demo_seeded', 'Synthetic demonstration case created for dashboard and matching validation.', null, c.status, 'internal'
from cases c where c.is_synthetic and c.reference like 'CL-DEMO-%'
and not exists (select 1 from case_actions a where a.case_id = c.id and a.action_type = 'demo_seeded');

insert into coordination_alerts (case_id, title, reason, severity, recommended_action, due_at, status)
select c.id, 'Synthetic overdue demonstration case', 'The seeded next-action date is overdue and should appear in coordination monitoring.', 'high',
       'Review the case history and record the next operational step.', c.due_at, 'open'
from cases c where c.reference in ('CL-DEMO-RB-001', 'CL-DEMO-EXAM-002')
and not exists (select 1 from coordination_alerts a where a.case_id = c.id and a.title = 'Synthetic overdue demonstration case');

-- Do not insert case_relationships here: run the existing semantic analysis endpoint
-- after loading the data so AI results are generated by the configured model.
