import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) return res.status(401).json({ message: "Token não fornecido" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔑 [DEBUG] Token decodificado:', JSON.stringify(decoded, null, 2));
        req.user = decoded; // salva dados do usuário no request
        next();
    } catch (err) {
        console.error("Erro no authenticateToken:", err);
        return res.status(403).json({ message: "Token inválido ou expirado" });
    }
};

// Export alias para compatibilidade
export const authMiddleware = authenticateToken;
