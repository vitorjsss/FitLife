import { pool } from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

const FoodRepository = {
    create: async (data) => {
        const id = uuidv4();
        const query = `
            INSERT INTO Food (id, name, descricao, image_path)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [id, data.name, data.descricao, data.image_path];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT * FROM Food WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    findAll: async () => {
        const query = 'SELECT * FROM Food ORDER BY name ASC;';
        const { rows } = await pool.query(query);
        return rows;
    },

    findByName: async (name) => {
        const query = 'SELECT * FROM Food WHERE name ILIKE $1;';
        const { rows } = await pool.query(query, [`%${name}%`]);
        return rows;
    },

    update: async (id, data) => {
        const query = `
            UPDATE Food 
            SET name = $2, descricao = $3, image_path = $4
            WHERE id = $1
            RETURNING *;
        `;
        const values = [id, data.name, data.descricao, data.image_path];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM Food WHERE id = $1;';
        await pool.query(query, [id]);
        return true;
    }
};

export { FoodRepository };
export default FoodRepository;