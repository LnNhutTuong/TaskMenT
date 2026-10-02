import {z} from 'zod';

export const AcademicSchema = z.object({
    moduleType: z.literal('ACADEMIC'),
    fields: z.object({
        standardScore: z.number().min(0).max(10),
        difficulty: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        expectedOutput: z.string().optional()
    })
})