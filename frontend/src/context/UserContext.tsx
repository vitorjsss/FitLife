import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { patientService } from "../services/PatientService";
import { nutricionistService } from "../services/NutricionistService";
import { physicalEducatorService } from "../services/PhysicalEducatorService";
import { authService } from "../services/authService";

interface UserData {
    id: string;
    name: string;
    role: string;
    [key: string]: any;
}

interface UserContextType {
    user: UserData | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: null,
    loading: true,
    refreshUser: async () => { },
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem("@fitlife:user_id");
            const userRole = await AsyncStorage.getItem("@fitlife:role");
            console.log('[UserContext] refreshUser - userId:', userId, 'userRole:', userRole);

            let data = null;
            if (userId && userRole) {
                try {
                    if (userRole === "Patient") {
                        data = await patientService.getByAuthId(userId);
                    } else if (userRole === "Nutricionist") {
                        data = await nutricionistService.getByAuthId(userId);
                    } else if (userRole === "Physical_educator") {
                        data = await physicalEducatorService.getByAuthId(userId);
                    }
                    console.log('[UserContext] Data fetched:', data);
                } catch (fetchError: any) {
                    console.error('[UserContext] Error fetching user data:', fetchError);
                    // Se o erro for 404, significa que o perfil ainda não foi criado
                    if (fetchError?.response?.status === 404 || fetchError?.message?.includes('404')) {
                        console.log('[UserContext] User profile not found (404) - keeping basic auth info');
                        // Define dados básicos com o auth_id
                        data = { auth_id: userId };
                    } else {
                        throw fetchError; // Re-throw outros erros
                    }
                }

                let email = null;
                if (data?.auth_id) {
                    const authData = await authService.getAuthById(data.auth_id);
                    email = authData?.email || null;
                }
                setUser({ ...data, role: userRole, email });
            } else {
                console.log('[UserContext] No userId or userRole found in storage');
                setUser(null);
            }
        } catch (err) {
            console.error('[UserContext] Error refreshing user:', err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};