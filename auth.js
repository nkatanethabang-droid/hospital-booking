
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

import db from '../config/db.js';
import { asyncHandler } from '../utils.js';

const router = express.Router();

// Validate form inputs
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    next();
};

// Generate JWT token
const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is missing from backend/.env');
    }

    return jwt.sign(
        user,
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
};

// =====================================
// PATIENT REGISTRATION
// =====================================

router.post('/register',
    body('fullName').trim().notEmpty()
        .withMessage('Enter your full name.'),

    body('email').trim().isEmail()
        .withMessage('Enter a valid email address.'),

    body('password').isLength({ min: 8 })
        .withMessage('Password must contain at least 8 characters.'),

    validate,

    asyncHandler(async (req, res) => {

        console.log('Registration request received.');

        const fullName = req.body.fullName.trim();
        const email = req.body.email.trim().toLowerCase();
        const phone = req.body.phone?.trim() || null;
        const password = req.body.password;

        // Check if email already exists
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: 'An account with this email already exists.'
            });
        }

        // Encrypt password
        const passwordHash = await bcrypt.hash(password, 12);

        // Save patient in database
        const [result] = await db.execute(
            `INSERT INTO users
            (full_name, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, ?)`,
            [fullName, email, phone, passwordHash, 'patient']
        );

        const user = {
            id: result.insertId,
            fullName: fullName,
            email: email,
            role: 'patient'
        };

        const token = generateToken(user);

        console.log('Patient registered successfully.');

        res.status(201).json({
            message: 'Account created successfully.',
            token,
            user
        });

    })
);

// =====================================
// PATIENT LOGIN
// =====================================

router.post('/login',

    body('email').trim().isEmail()
        .withMessage('Enter a valid email address.'),

    body('password').notEmpty()
        .withMessage('Enter your password.'),

    validate,

    asyncHandler(async (req, res) => {

        console.log('Login request received.');

        const email = req.body.email.trim().toLowerCase();
        const password = req.body.password;

        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (!rows.length) {
            return res.status(401).json({
                message: 'No account was found with this email address.'
            });
        }

        const userRecord = rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            userRecord.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'The password is incorrect.'
            });
        }

        const user = {
            id: userRecord.id,
            fullName: userRecord.full_name,
            email: userRecord.email,
            role: userRecord.role
        };

        const token = generateToken(user);

        console.log('Login successful.');

        res.json({
            message: 'Login successful.',
            token,
            user
        });

    })
);

// =====================================
// EXPORT ROUTER
// =====================================

export default router;
