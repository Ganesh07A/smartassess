import { Request , Response, response } from "express";
import prisma from "../lib/prisma"
import { Prisma } from "@prisma/client";    


// 1. teacher create exams 

export const createExam  = async (req: Request, res: Response) => {

    try {
        const { title , description, startTime , endTime, duration, totalMarks, questions } = req.body;

        if(!title || !description ||  !startTime || !endTime || !duration || !totalMarks || !questions) {
            res.status(400).json("All fields are necessary !")
            return;
        }

        const teacherId = req.user?.id;
        if (!teacherId) {
            res.status(401).json("Unauthorized: User not found");
            return;
        }

        const newExam = await prisma.exam.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration,
                totalMarks,
                teacherId: teacherId,
                questions: {
                    create: questions.map((q: any) => ({
                        text: q.text,
                        type: q.type,
                        marks: q.marks,
                        mcqOptions: q.mcqOptions,
                        testCases: q.testCases
                    }))
                }   
            }
        })
    }
}