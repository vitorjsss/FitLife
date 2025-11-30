export const API_CONFIG = {
    // BASE_URL: "http://192.168.10.5:5001",
    BASE_URL: "http://192.168.10.5:5001",
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
            UPLOAD_AVATAR: '/patient/{id}/avatar',
        },
        PHYSICAL_EDUCATOR: {
            CREATE: "/physical-educator/register",
            GET_ALL: "/physical-educator/all",
            GET_BY_ID: "/physical-educator/{id}",
            UPDATE: "/physical-educator/{id}",
            GET_BY_AUTH_ID: "/physical-educator/by-auth/{auth_id}",
            UPLOAD_AVATAR: '/physical-educator/{id}/avatar',
        },
        NUTRICIONIST: {
            CREATE: "/nutricionist/register",
            GET_ALL: "/nutricionist/all",
            GET_BY_ID: "/nutricionist/{id}",
            UPDATE: "/nutricionist/{id}",
            GET_BY_AUTH_ID: "/nutricionist/by-auth/{auth_id}",
            UPLOAD_AVATAR: '/nutricionist/{id}/avatar',
        },
        PATIENT_PROFESSIONAL_ASSOCIATION: {
            GET_BY_PATIENT_ID: "/patient-professional-association/patient/{patientId}",
        },
    },
    TIMEOUT: 30000,
    IGNORE_SSL_ERRORS: true,
};