import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import db from './config/db.js';
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import adminRoutes from './routes/admin.js';
import { authenticate } from './middleware/auth.js';
import { asyncHandler } from './utils.js';

const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));

app.use(express.json());

app.get('/api/health', asyncHandler(async (req, res) => {
    await db.query('SELECT 1');

    res.json({
        status: 'ok',
        database: 'connected'
    });
}));

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/profile', authenticate, asyncHandler(async (req, res) => {
    const [rows] = await db.execute(
        'SELECT id, full_name AS fullName, email, phone, role, created_at FROM users WHERE id = ?',
        [req.user.id]
    );

    res.json(rows[0] || null);
}));

app.use((req, res) => {
    res.status(404).json({ message: 'API route not found.' });
});

app.use((err, req, res, next) => {
    console.error('Backend error:', err);

    res.status(500).json({
        message: 'Server error. Check the backend terminal.'
    });
});

const PORT = process.env.PORT || 5001;

async function startServer() {
    try {
        await db.query('SELECT 1');

        app.listen(PORT, () => {
            console.log(`Hospital API running at http://localhost:${PORT}`);
            console.log('MySQL database connected successfully.');
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
}

startServer();