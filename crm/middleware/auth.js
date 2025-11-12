/**
 * Authentication and Authorization Middleware
 *
 * Provides JWT authentication and role-based authorization
 * for the Clover ERA CRM and Blog CMS
 */

const jwt = require('jsonwebtoken');
const db = require('../db/connection');

// =====================================================
// Authentication Middleware
// =====================================================

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No valid authorization token provided'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    message: 'Your session has expired. Please log in again.'
                });
            }

            return res.status(401).json({
                error: 'Invalid token',
                message: 'The provided token is invalid'
            });
        }

        // Fetch user from database
        const query = `
            SELECT
                id,
                email,
                user_type,
                partner_id,
                partner_status
            FROM users
            WHERE id = $1
        `;

        const result = await db.query(query, [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'User not found',
                message: 'The user associated with this token does not exist'
            });
        }

        const user = result.rows[0];

        // Check if user is active (if you have a status field)
        // if (user.status === 'inactive') {
        //     return res.status(403).json({
        //         error: 'Account inactive',
        //         message: 'Your account has been deactivated'
        //     });
        // }

        // Attach user to request
        req.user = user;
        req.token = token;

        next();

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: 'An error occurred during authentication'
        });
    }
};

// =====================================================
// Authorization Middleware (Role-Based)
// =====================================================

/**
 * Check if user has one of the required roles
 * @param {Array<string>} allowedRoles - Array of allowed user_type values
 * @returns {Function} Express middleware function
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated first
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'You must be logged in to access this resource'
            });
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.user_type)) {
            return res.status(403).json({
                error: 'Access denied',
                message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`,
                required_roles: allowedRoles,
                user_role: req.user.user_type
            });
        }

        next();
    };
};

// =====================================================
// Blog-Specific Authorization Middleware
// =====================================================

/**
 * Check if user has blog editing permissions
 * Admins, editors, and authors can access blog features
 */
const requireBlogAccess = (req, res, next) => {
    const allowedRoles = ['admin', 'editor', 'author'];

    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'You must be logged in to access blog features'
        });
    }

    if (!allowedRoles.includes(req.user.user_type)) {
        return res.status(403).json({
            error: 'Access denied',
            message: 'You do not have permission to access blog features',
            hint: 'Contact an administrator to request blog access'
        });
    }

    next();
};

/**
 * Check if user can publish articles
 * Only admins and editors can publish
 */
const requirePublishPermission = (req, res, next) => {
    const allowedRoles = ['admin', 'editor'];

    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    if (!allowedRoles.includes(req.user.user_type)) {
        return res.status(403).json({
            error: 'Insufficient permissions',
            message: 'Only administrators and editors can publish articles'
        });
    }

    next();
};

/**
 * Check if user owns a resource or is an admin
 * Used for editing/deleting user-specific content
 */
const requireOwnershipOrAdmin = (resourceType) => {
    return async (req, res, next) => {
        try {
            // Admin can access everything
            if (req.user.user_type === 'admin') {
                return next();
            }

            const resourceId = req.params.id;

            // Query based on resource type
            let query;
            let ownerField;

            if (resourceType === 'article') {
                query = 'SELECT author_id FROM blog_articles WHERE id = $1';
                ownerField = 'author_id';
            } else {
                return res.status(400).json({ error: 'Invalid resource type' });
            }

            const result = await db.query(query, [resourceId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Resource not found',
                    message: `${resourceType} not found`
                });
            }

            const resource = result.rows[0];

            // Check ownership
            if (resource[ownerField] !== req.user.id) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: `You can only access your own ${resourceType}s`
                });
            }

            next();

        } catch (error) {
            console.error('Ownership check error:', error);
            res.status(500).json({
                error: 'Authorization check failed'
            });
        }
    };
};

// =====================================================
// Partner-Specific Authorization
// =====================================================

/**
 * Check if user is an active partner
 */
const requirePartnerAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    if (req.user.user_type !== 'partner' && req.user.user_type !== 'partner_admin') {
        return res.status(403).json({
            error: 'Partner access required',
            message: 'This resource is only available to partners'
        });
    }

    if (req.user.partner_status !== 'active') {
        return res.status(403).json({
            error: 'Partner account not active',
            message: 'Your partner account is pending approval or inactive'
        });
    }

    next();
};

/**
 * Check if user owns a partner resource or is admin
 */
const requirePartnerOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const { id } = req.params;
            const { partner_id, user_type } = req.user;

            // Admin can access everything
            if (user_type === 'admin') {
                return next();
            }

            // Query based on resource type
            let query;
            if (resourceType === 'lead') {
                query = 'SELECT partner_id, created_by_user_id FROM partner_leads WHERE id = $1';
            } else if (resourceType === 'customer') {
                query = 'SELECT partner_id FROM companies WHERE id = $1';
            } else {
                return res.status(400).json({ error: 'Invalid resource type' });
            }

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Resource not found'
                });
            }

            const resource = result.rows[0];

            // Partner admin can access all resources for their organization
            if (user_type === 'partner_admin' && resource.partner_id === partner_id) {
                return next();
            }

            // Partner user can only access resources they created
            if (user_type === 'partner' && resource.created_by_user_id === req.user.id) {
                return next();
            }

            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to access this resource'
            });

        } catch (error) {
            console.error('Partner ownership check error:', error);
            res.status(500).json({
                error: 'Authorization check failed'
            });
        }
    };
};

// =====================================================
// Rate Limiting Helper
// =====================================================

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting
 */
const rateLimitMap = new Map();

const rateLimit = (maxRequests, windowMs) => {
    return (req, res, next) => {
        const key = req.user ? req.user.id : req.ip;
        const now = Date.now();

        if (!rateLimitMap.has(key)) {
            rateLimitMap.set(key, []);
        }

        const requests = rateLimitMap.get(key);

        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => now - timestamp < windowMs);

        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Too many requests',
                message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds`,
                retry_after: Math.ceil((validRequests[0] + windowMs - now) / 1000)
            });
        }

        validRequests.push(now);
        rateLimitMap.set(key, validRequests);

        next();
    };
};

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitMap.entries()) {
        const validTimestamps = timestamps.filter(t => now - t < 3600000); // Keep last hour
        if (validTimestamps.length === 0) {
            rateLimitMap.delete(key);
        } else {
            rateLimitMap.set(key, validTimestamps);
        }
    }
}, 300000);

// =====================================================
// Exports
// =====================================================

module.exports = {
    authenticate,
    authorize,
    requireBlogAccess,
    requirePublishPermission,
    requireOwnershipOrAdmin,
    requirePartnerAccess,
    requirePartnerOwnership,
    rateLimit
};
