export const API_CONFIG = {
    BASE_URL: "http://192.168.1.106:5001",
    ENDPOINTS: {
        AUTH: {
            REGISTER: "/auth/register",
            LOGIN: "/auth/login"
        },
        PATIENT: {
            CREATE: "/patient/register",
            GET_ALL: "/patient/all",
            GET_BY_ID: "/patient/{id}",
            UPDATE: "/patient/{id}",
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
    TIMEOUT: 10000,
    IGNORE_SSL_ERRORS: true,
}; 