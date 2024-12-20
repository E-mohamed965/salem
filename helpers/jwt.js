const { expressjwt: expressJwt } = require('express-jwt');

function authJwt() {
    const secret = process.env.secret;

    return expressJwt({
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked,
    }).unless({
        path: [
            // Public routes that don't require authentication
            { url: /\/public\/uploads\/.*/, methods: ['GET'] },
            { url: /\/rooms(.*)/, methods: ['GET', 'OPTIONS'] },
            '/users/login',
            '/users/register',
        ],
    });
}

// Define routes allowed for registered users
const registeredUserRoutes = [
    { url: /^\/users\/[a-fA-F0-9]{24}$/, methods: ['GET'] }, 
    { url: /\/booking/, methods: ['POST'] },
    { url: /\/booking\/(.*)/, methods: ['GET', 'DELETE','PUT'] },
];


// Adjust the `isRevoked` function
async function isRevoked(req, tokenPayload) {
    if (!tokenPayload || !tokenPayload.payload) {
        console.log('Token is missing or invalid:', tokenPayload);
        return true; // Revoke access
    }

    const { id, isAdmin, isRegistered } = tokenPayload.payload;
    console.log(`Token Details - id: ${id}, isAdmin: ${isAdmin}, isRegistered: ${isRegistered}`);

    // Allow admin full access
    if (isAdmin) {
        console.log('Admin access granted');
        return false; // Do not revoke
    }

    // Allow registered users limited access
    if (isRegistered) {
        const isAllowed = registeredUserRoutes.some((route) => {
            const routeRegex = new RegExp(route.url);
            return routeRegex.test(req.originalUrl) && route.methods.includes(req.method);
        });

        if (isAllowed) {
            console.log('Registered user access granted');
            return false; // Do not revoke for allowed routes
        }

        console.log('Access denied: Registered user trying to access unauthorized route');
        return true; // Revoke access for unauthorized routes
    }

    // Revoke access for unregistered users
    console.log('Access revoked: User is not registered');
    return true;
}


module.exports = authJwt;
