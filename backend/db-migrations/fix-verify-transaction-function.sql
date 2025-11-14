-- Corrigir função verify_transaction_integrity
DROP FUNCTION IF EXISTS verify_transaction_integrity(BIGINT);

CREATE OR REPLACE FUNCTION verify_transaction_integrity(p_transaction_id BIGINT)
RETURNS TABLE(
    is_complete BOOLEAN,
    operations_count INTEGER,
    affected_tables TEXT[],
    timestamp_range TSRANGE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) > 0 as is_complete,
        COUNT(*)::INTEGER as operations_count,
        ARRAY_AGG(DISTINCT table_name::TEXT) as affected_tables,
        TSRANGE(MIN(changed_at), MAX(changed_at)) as timestamp_range
    FROM meal_audit_log
    WHERE transaction_id = p_transaction_id;
END;
$$ LANGUAGE plpgsql;
