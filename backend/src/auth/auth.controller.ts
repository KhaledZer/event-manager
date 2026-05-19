import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma/client.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { LoginBody, RegisterBody } from './auth.schema.js';

const prisma = new PrismaClient();

export const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    // 2. Compare password against stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    // 3. Sign access token (15 min)    
    const secret = process.env['JWT_SECRET']!;
    const accessToken = jwt.sign({ userId: user.id }, secret, { expiresIn: '15m' });

    // 4. Generate refresh token and save to DB (7 days)
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.refreshToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: 'Logged in successfully' });
  } catch (err) {
    next(err);
  }
};

export const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) { res.status(400).json({ error: 'Email already in use' }); return; }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const accessToken = jwt.sign({ userId: user.id }, process.env['JWT_SECRET']!, { expiresIn: '15m' });
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    next(err);
  }
};  
