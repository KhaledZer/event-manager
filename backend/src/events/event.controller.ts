import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const events = await prisma.event.findMany({
      where: { userId },
      include: { attendees: true },
    });
    res.status(200).json(events);
  } catch (err) {
    next(err);
  }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, startTime, endTime } = req.body;
    const userId = req.userId!;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        userId,
      },
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;
    const { title, description, startTime, endTime } = req.body;
    const userId = req.userId!;

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent || existingEvent.userId !== userId) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    res.status(200).json(event);
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;
    const userId = req.userId!;

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent || existingEvent.userId !== userId) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    await prisma.event.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};