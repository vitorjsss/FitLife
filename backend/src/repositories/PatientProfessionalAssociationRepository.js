import { pool } from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

const PatientProfessionalAssociationRepository = {
    create: async (data) => {
        const id = uuidv4();
        const query = `
            INSERT INTO patient_professional_association 
            (id, patient_id, nutricionist_id, physical_educator_id, is_active)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [
            id,
            data.patient_id,
            data.nutricionist_id || null,
            data.physical_educator_id || null,
            data.is_active !== undefined ? data.is_active : true
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT * FROM patient_professional_association WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    findByPatientId: async (patientId) => {
        const query = `
            SELECT ppa.*, 
                   p.name as patient_name,
                   n.name as nutricionist_name,
                   pe.name as physical_educator_name
            FROM patient_professional_association ppa
            LEFT JOIN patient p ON ppa.patient_id = p.id
            LEFT JOIN nutricionist n ON ppa.nutricionist_id = n.id
            LEFT JOIN physical_educator pe ON ppa.physical_educator_id = pe.id
            WHERE ppa.patient_id = $1 AND ppa.is_active = true;
        `;
        const { rows } = await pool.query(query, [patientId]);
        return rows[0];
    },

    findPatientsByNutricionistId: async (nutricionistId) => {
        const query = `
            SELECT ppa.*, 
                   p.id as patient_id,
                   p.name as patient_name,
                   p.birthdate,
                   p.sex,
                   p.contact,
                   p.avatar_path
            FROM patient_professional_association ppa
            INNER JOIN patient p ON ppa.patient_id = p.id
            WHERE ppa.nutricionist_id = $1 AND ppa.is_active = true
            ORDER BY p.name;
        `;
        const { rows } = await pool.query(query, [nutricionistId]);
        return rows;
    },

    findPatientsByPhysicalEducatorId: async (physicalEducatorId) => {
        const query = `
            SELECT ppa.*, 
                   p.id as patient_id,
                   p.name as patient_name,
                   p.birthdate,
                   p.sex,
                   p.contact,
                   p.avatar_path
            FROM patient_professional_association ppa
            INNER JOIN patient p ON ppa.patient_id = p.id
            WHERE ppa.physical_educator_id = $1 AND ppa.is_active = true
            ORDER BY p.name;
        `;
        const { rows } = await pool.query(query, [physicalEducatorId]);
        return rows;
    },

    update: async (id, data) => {
        const fields = [];
        const values = [];
        let paramCount = 1;

        console.log('[PatientProfessionalAssociationRepository] update - id:', id, 'data:', data);

        if (data.nutricionist_id !== undefined) {
            fields.push(`nutricionist_id = $${paramCount++}`);
            values.push(data.nutricionist_id);
        }
        if (data.physical_educator_id !== undefined) {
            fields.push(`physical_educator_id = $${paramCount++}`);
            values.push(data.physical_educator_id);
        }
        if (data.is_active !== undefined) {
            fields.push(`is_active = $${paramCount++}`);
            values.push(data.is_active);
        }

        fields.push(`updated_at = NOW()`);

        // O id vai no último parâmetro para o WHERE
        values.push(id);

        const query = `
            UPDATE patient_professional_association
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *;
        `;

        console.log('[PatientProfessionalAssociationRepository] Query:', query);
        console.log('[PatientProfessionalAssociationRepository] Values:', values);

        const { rows } = await pool.query(query, values);

        console.log('[PatientProfessionalAssociationRepository] Resultado:', rows[0]);

        return rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM patient_professional_association WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    deactivate: async (id) => {
        const query = `
            UPDATE patient_professional_association 
            SET is_active = false, updated_at = NOW() 
            WHERE id = $1 
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }
};

export default PatientProfessionalAssociationRepository;
