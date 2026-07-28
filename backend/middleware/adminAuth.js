console.log("ADMINAUTH FILE GELADEN");

const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Geen toegang. Log eerst in.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'ADMIN') {
            return res.status(403).json({
                error: 'Alleen admins hebben toegang.'
            });
        }

        req.user = decoded;
        next();

    } catch (err) {
        return res.status(401).json({
            error: 'Ongeldig token.'
        });
    }
};

module.exports = adminAuth;