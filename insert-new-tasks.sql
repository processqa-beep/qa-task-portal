-- =========================================================
-- SQL Migration Script to:
-- 1. Remove UNIQUE(employee_id, date) constraint so multiple tasks per day can be saved
-- 2. Insert all 54 task entries for Hiren Dodiya and Mehul Chikhaliya
-- Copy & Run this in your Supabase SQL Editor
-- =========================================================

-- Remove the unique constraint if it exists
ALTER TABLE daily_tasks DROP CONSTRAINT IF EXISTS daily_tasks_employee_id_date_key;

-- Ensure employee records exist
INSERT INTO employees (id, name, role, pin) VALUES
  ('QA001', 'Mehul Chikhaliya', 'leader', '1234'),
  ('QA005', 'Hiren Dodiya', 'employee', '1234')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Clear previous task entries to prevent duplicates during re-import
DELETE FROM daily_tasks WHERE employee_id IN ('QA001', 'QA005') AND date >= '2026-07-14';

-- Insert all 54 task records individually
INSERT INTO daily_tasks (employee_id, date, work_type, task_performed, status) VALUES
  ('QA005', '2026-07-14', 'Additional', 'Great Place to Work Survey Completed', 'Completed'),
  ('QA005', '2026-07-14', 'IMS', 'PROCEDURE FOR OBJECTIVES, TARGETS AND PROGRAMS - updation is in progress', 'Completed'),
  ('QA005', '2026-07-14', 'IMS', 'Need to prepare Objectives deploments(to link Objective procedure with manual) - In progress', 'Completed'),
  ('QA005', '2026-07-14', 'IMS', 'Customer feedback survey has been updated as requirement from Arindam Sir (2 question modification and 1 question addition)', 'Completed'),
  ('QA005', '2026-07-14', 'IMS', '3S customer audit at Kaveri - in second half', 'Completed'),
  ('QA005', '2026-07-15', 'IMS', 'Prepare process flow diagram for BRL from Raw material to Dispatch for 3S solar. Share process flow with Kapil to sent 3S team', 'Completed'),
  ('QA005', '2026-07-15', 'IMS', 'Prepared Objectives deploments, this sheet helps to undestand the linkage between plant objectives to QHSE policy', 'Completed'),
  ('QA005', '2026-07-15', 'IMS', 'Procedure for Objectives, Targets and programs has been updated with new format as well as linked with the Objective deployment', 'Completed'),
  ('QA005', '2026-07-15', 'Process Audit', 'Process audit at SG#3.1 cutting line and lehr: no major violation found as per the process audit sheet', 'Completed'),
  ('QA005', '2026-07-15', 'Process Audit', 'Process audit at Benteler 7: no major violation found as per the process audit sheet', 'Completed'),
  ('QA005', '2026-07-15', 'Process Audit', 'Field round at TL#7 - SOP displayed are already OBSOLTED version behind benteler 7, oil leakage from conveyor motor just after ARC 7.3 acumulator, Fire hose box HB-50 (behind tempering) key not available.', 'Completed'),
  ('QA005', '2026-07-15', 'Devlopment', 'RMS needs to updated with: Refractory management for lipblock, overflow block, flat arc, moving block - initiated', 'Completed'),
  ('QA005', '2026-07-16', 'Devlopment', 'DMS based - ISO format portal with document number and printable PDF - maintain standard format across all the plant and avoid self developed formats (checksheet, attendance sheet, gate pass, etc)', 'Completed'),
  ('QA005', '2026-07-16', 'IMS', 'Lexcare all pending compliance has been updated - total 9 compliance was pending', 'Completed'),
  ('QA005', '2026-07-16', 'IMS', 'L2021 - Procedure for communication, participation and consultant has been reformed, revised and prepared with detailed information and practices', 'Completed'),
  ('QA005', '2026-07-16', 'Additional', 'Static bar stand collected from Workshop, shifted to SG#3.2 line, and installed at SG#3.2 line with help of workshop team, Chinese static bar attached with the stand.', 'Completed'),
  ('QA005', '2026-07-17', 'IMS', 'Procedure for Monitoring, measurement, analysis and evaluation has been prepared with proper formatting, details and alogned with ISO principles', 'Completed'),
  ('QA005', '2026-07-17', 'IMS', 'Procedure for Product inspection and testing has been prepared with proper formatting, details and alogned with ISO principles', 'Completed'),
  ('QA005', '2026-07-17', 'Additional', 'Go to Vipul patel for connection of Static bar power connection, he was engaged in some priority work and due to the same the task has not been completed today, I visit several time but he was not available', 'Completed'),
  ('QA005', '2026-07-17', 'Additional', 'One Unsafe confidition logged in the system', 'Completed'),
  ('QA005', '2026-07-17', 'IMS', 'During field round, observation found: Oil dropping from the cutting oil pump inside the Cloud vision cabin, issue noted in the deviation list', 'Completed'),
  ('QA005', '2026-07-17', 'Process Audit', 'Process audit for TL#1 has not completed due to the line was not in operation', 'Completed'),
  ('QA005', '2026-07-18', 'Additional', 'Meet Mr. Vipul Patel for Static bar connection: With his support, static bar electrical connection as well as pneumatic connection both done, their technician come with all necessary things (wire, power adeptor, pipe, connector, cover, etc)', 'Completed'),
  ('QA005', '2026-07-18', 'Process Audit', 'Process audit done at ARC#6', 'Completed'),
  ('QA005', '2026-07-18', 'IMS', 'Electrical calibration has updated in the DMS portal, certificate attached too', 'Completed'),

  ('QA001', '2026-07-14', 'Cloud Vision', 'In the SG#2 cloud vision thickness dashboard made changes such as: included auto select the target in 4 and 5 mm glass, added filter for with and without trim selection, included with logic to remove outlier from only L2 to R2 points data (no outlier removal logic for trim data), Improved dashboard modern UI', 'Completed'),
  ('QA001', '2026-07-14', 'Data Analysis', 'Updated the SAP production and Annealing lines rejection reports', 'Completed'),
  ('QA001', '2026-07-14', 'Data Analysis', 'Created Capex PR for Ribbon Completeness Detection machines for SG#3.1 & 3.2', 'Completed'),
  ('QA001', '2026-07-14', 'Cloud Vision', 'conducted a thickness verification survey on the SG#2 line to compare the readings from the Cloud Vision Online Thickness Measurement System with the manual plunger gauge method. delta observed from 0.00 mm to 0.08 mm on L3 and L4 point', 'Completed'),
  ('QA001', '2026-07-14', 'Additional', 'Helped to Jatin on internal glass Breakage in pallet data Analysis', 'Completed'),
  ('QA001', '2026-07-15', 'Additional', 'Great Place to Work survey has been completed', 'Completed'),
  ('QA001', '2026-07-15', 'Data Analysis', 'Updated the Prediction report and PBI Dashboard', 'Completed'),
  ('QA001', '2026-07-15', 'Data Analysis', 'Updated the finished goods and WIP stock report and PBI dashboard', 'Completed'),
  ('QA001', '2026-07-15', 'Process Audit', 'Process audit SG#3.1 Lehr and Cutting line has been done', 'Completed'),
  ('QA001', '2026-07-15', 'Data Analysis', 'Get Taken Static bar from the Admin and kept in SG#3.2 ISRA cabin', 'Completed'),
  ('QA001', '2026-07-15', 'Additional', 'Gone to Workshop for stand with Hiren, explained the requirement, and provided the Old Antistatic bar', 'Completed'),
  ('QA001', '2026-07-15', 'Cloud Vision', 'Worked on the SG#2 Completeness System. Checked the chipping glass and found that all of them had edge chipping. However, the Packing Supervisor kept them in the OK glass rack. so the machine is not mixing OK glass in Rejection rack', 'Completed'),
  ('QA001', '2026-07-16', 'Cloud Vision', 'The completeness machine photoelectric left sensor intensity has slightly been decreased by intrument engineer', 'Completed'),
  ('QA001', '2026-07-16', 'Cloud Vision', 'In the cloud vision thickness dashboard: improved heat map chart, kpi cards, filters and scatter chart, correct the charts Y axis in live dashboard', 'Completed'),
  ('QA001', '2026-07-16', 'Data Analysis', 'Updated the Customer complaint report and PBI dashboard', 'Completed'),
  ('QA001', '2026-07-16', 'Data Analysis', 'Updated the Module Breakage report and PBI dashboard', 'Completed'),
  ('QA001', '2026-07-16', 'Cloud Vision', 'Conducted a thickness verification survey on the SG#2 line to compare the readings from the Cloud Vision Online Thickness Measurement System with the manual plunger gauge method. delta observed from 0.00 mm to 0.02 mm on L3 and L4 point in 5.0 mm thickness glass', 'Completed'),
  ('QA001', '2026-07-16', 'Process Audit', 'Audit has been done of SG#1 Robot 2 Gripper and Frame Components.', 'Completed'),
  ('QA001', '2026-07-16', 'Data Analysis', 'SG#2 Defect Inspection Machine Survey Report', 'Completed'),
  ('QA001', '2026-07-17', 'Data Analysis', 'Included defects photos in T-Chart for Grinding Defect excel file', 'Completed'),
  ('QA001', '2026-07-17', 'Cloud Vision', 'Conducted a thickness verification survey on the SG#2 line to compare the readings from the Cloud Vision Online Thickness Measurement System with the manual plunger gauge method. delta observed from 0.02 mm to 0.12 mm on R3, R4 and R5 points in 5.0 mm thickness glass', 'Completed'),
  ('QA001', '2026-07-17', 'Cloud Vision', 'Worked on the SG#2 Completeness System: Checked 100 NG glass sheets and found that only 3 sheets had cullet particles, and all were correctly placed in the rejection rack by the cloud vision system. However, as per the Packing Supervisor, 25 to 35 glass sheets in a rack of 70 glas sheets to were found without ink marking but were packed in the rejection rack. After discussing and checked by the Mr. Zhang there were high chipping detection of Edge and Corner flacking defects so as per him the specifications for Edge and corner flacking have been changed to 5 x 3 mm, also glass of different lengths, triggering a logic of length judging NG in the software. which have turned it off (@ 5:30 pm), which may be the reason. the password protection activated for specifications change tab (now password is required for specifications change)', 'Completed'),
  ('QA001', '2026-07-17', 'Data Analysis', 'SG#3 Furnace Process audit check sheet shared to Amit Saini', 'Completed'),
  ('QA001', '2026-07-18', 'Cloud Vision', 'In the SG#2 Thickness dashboard: the right and left filter included, included Min, Max and Avg in the thickness trends charts for the filtered data, improved time to first load data', 'Completed'),
  ('QA001', '2026-07-18', 'Data Analysis', 'Updated SAP production and Annealing lines rejection reports', 'Completed'),
  ('QA001', '2026-07-18', 'Data Analysis', 'Prepared QC testing equipment list', 'Completed'),
  ('QA001', '2026-07-18', 'Additional', 'I and Hiren seek help from instrument team, connected the Antistatic bar with air and power supply, initially It was starting with dark green lights after some time it automatically blink the dark red lights (blinking red light indicates an active fault, high voltage abnormality, or maintenance alarm.)', 'Completed'),
  ('QA001', '2026-07-20', 'Devlopment', 'in the SG#2 dashboard: improved its auto select target thickness as it is not in raw system data, add min, max and avg in rest charts to show filtered data statics in charts and add both glass side filter to show side by side thickness charts.', 'Completed'),
  ('QA001', '2026-07-20', 'Devlopment', 'The thickness Duckdb file code for generate two duckdb; one in main pc and another in 219 network pc with every minute data dumping, moved the SG#2 dashboard to 219 network pc.', 'Completed'),
  ('QA001', '2026-07-20', 'Data Analysis', 'Updated the Anneal GD vs GD Slippage trends for FY 2026-27', 'Completed');
