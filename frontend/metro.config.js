const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Aumentar timeout para Windows (5 minutos)
// Isso resolve problemas de "Request timeout" no Expo
config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => {
        return (req, res, next) => {
            res.setTimeout(300000); // 5 minutos
            return middleware(req, res, next);
        };
    },
};

// Otimizações para performance no Windows
config.resolver = {
    ...config.resolver,
    sourceExts: [...config.resolver.sourceExts, 'cjs'],
};

config.transformer = {
    ...config.transformer,
    minifierConfig: {
        keep_classnames: true,
        keep_fnames: true,
        mangle: {
            keep_classnames: true,
            keep_fnames: true,
        },
    },
};

module.exports = config;
