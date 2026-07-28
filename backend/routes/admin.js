const express = require('express');
const { PrismaClient } = require('@prisma/client');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();
const prisma = new PrismaClient();

// Testroute
router.get('/dashboard', adminAuth, (req, res) => {
    res.json({
        message: 'Welkom op het Admin Dashboard',
        admin: req.user
    });
});

// Alle gebruikers ophalen
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Kon gebruikers niet ophalen.'
        });
    }
});

module.exports = router;