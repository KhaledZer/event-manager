import 'dotenv/config';
import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './errorHandler.js';
import authRouter from './auth/auth.router.js';

const app: Application = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRouter);
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use(errorHandler);
const PORT = process.env['PORT'] ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
