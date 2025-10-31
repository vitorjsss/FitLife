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
            let data = null;
            if (userId && userRole) {
                if (userRole === "Patient") {
                    data = await patientService.getByAuthId(userId);
                } else if (userRole === "Nutricionist") {
                    data = await nutricionistService.getById(userId);
                } else if (userRole === "Physical_educator") {
                    data = await physicalEducatorService.getById(userId);
                }
                let email = null;
                if (data?.auth_id) {
                    const authData = await authService.getAuthById(data.auth_id);
                    email = authData?.email || null;
                }
                setUser({ ...data, role: userRole, email });
            } else {
                setUser(null);
            }
        } catch (err) {
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