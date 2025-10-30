export const API_CONFIG = {
    BASE_URL: "http://localhost:5001",
    ENDPOINTS: {
        AUTH: {
            REGISTER: "/auth/register",
            LOGIN: "/auth/login",
            REFRESH: "/auth/refresh-token",
        },
        PATIENT: {
            CREATE: "/patient/register",
            GET_ALL: "/patient/all",
            GET_BY_ID: "/patient/{id}",
            UPDATE: "/patient/{id}",
            GET_BY_AUTH_ID: "/patient/auth/{auth_id}",
        },
        PHYSICAL_EDUCATOR: {
            CREATE: "/physical-educator/register",
            GET_ALL: "/physical-educator/all",
            GET_BY_ID: "/physical-educator/{id}",
            UPDATE: "/physical-educator/{id}",
        },
        NUTRICIONIST: {
            CREATE: "/nutricionist/register",
            GET_ALL: "/nutricionist/all",
            GET_BY_ID: "/nutricionist/{id}",
            UPDATE: "/nutricionist/{id}",
        },
    },
    TIMEOUT: 30000,
    IGNORE_SSL_ERRORS: true,
};