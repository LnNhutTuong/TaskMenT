import {z} from 'zod';

export const OperationalSchema = z.object({
    moduleType: z.literal('OPERATIONAL'),
    fields: z.object({
        estimatedHours: z.number().min(0),
        actualHours: z.number().min(0).optional(),
        department: z.string().optional()
    })
})