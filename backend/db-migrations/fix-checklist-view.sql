-- ================================================
-- FIX: Corrigir VIEW checklist_history
-- ================================================

CREATE OR REPLACE VIEW checklist_history AS
SELECT 
    cl.id,
    cl.record_type,
    cl.record_id,
    cl.checked,
    cl.checked_at,
    cl.sync_status,
    p.name as patient_name,
    CASE 
        WHEN cl.record_type = 'meal' THEN mr.name
        WHEN cl.record_type = 'workout' THEN wr.name
    END as record_description,
    CASE 
        WHEN cl.record_type = 'meal' THEN mr.date
        WHEN cl.record_type = 'workout' THEN wr.date
    END as record_date
FROM checklist_log cl
LEFT JOIN patient p ON cl.checked_by = p.id
LEFT JOIN mealrecord mr ON cl.record_type = 'meal' AND cl.record_id = mr.id
LEFT JOIN workoutrecord wr ON cl.record_type = 'workout' AND cl.record_id = wr.id
ORDER BY cl.checked_at DESC;
