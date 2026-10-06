import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFormulaDto } from './dto/create-formula.dto.js';
import { UpdateFormulaDto } from './dto/update-formula.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { WorkspaceService } from '../workspace/workspace.service.js';
import {extractVariables, validateExpressionSyntax} from "./utils/formula.utils.js"
import { TaskService } from '../task/task.service.js';

@Injectable()
export class FormulaService {
    constructor(private readonly prisma: PrismaService, private readonly workspaceService: WorkspaceService, private readonly taskService: TaskService){}

    async create(dto: CreateFormulaDto, user: AuthUser){
        await this.workspaceService.assertWorkspaceMember(dto.workspaceId, user.id)

        //lay cong thuc ra -> lay nhung key metric -> bien cac key do thanh mang
        const variables =  extractVariables(dto.expression);

        if(variables.length === 0 ){
            throw new BadRequestException('Expression must contain at least one metric variable')
        }

        //test cong thuc -> thay cac key metric thanh 1
        validateExpressionSyntax(dto.expression, variables);

        //lay cac key metric da ton tai trong workspace
        const existingMetrics = await this.prisma.metric.findMany({
            where:{
                workspaceId: dto.workspaceId,
                key:{
                    in: variables //chi lay cac key co xuat hien trong expression truyen vao
                }        
            },
            select:{
                key: true
            }
        })

        //tao danh sach key metric hop le
        const validKeys = new Set(existingMetrics.map(m=>m.key));
            
        //filter cai mang key metric, tung thang trong do 
        // neu khong co trong danh sach-> throw error
        const invalidKeys = variables.filter(variable => !validKeys.has(variable))

        if(invalidKeys.length > 0){
            throw new BadRequestException(`Some metrics in the expression do not exist: ${invalidKeys.join(', ')}`)
        }

        return this.prisma.formula.create({
            data:{
                workspaceId: dto.workspaceId,
                name: dto.name,
                expression: dto.expression, //luu cai chuoi cong thuc, khong phai luu mang cac key metric
                description: dto.description
            }
        })

    }

    async findByWorkspace(workspaceId: string, user: AuthUser){
        await this.workspaceService.findOne(workspaceId, user);
        
        const formula = await this.prisma.formula.findMany({
            where:{
                workspaceId
            }
        })
        
        return formula;
    } 

    async update(id: string, dto:UpdateFormulaDto, user: AuthUser){
        const formula = await this.prisma.formula.findUnique({
            where:{
                id
            }
        })

        if(!formula){
            throw new NotFoundException('Formula not found');
        }

        await this.workspaceService.assertWorkspaceMember(formula.workspaceId, user.id);
        
        if(dto.expression){
            //lay cong thuc ra -> lay nhung key metric -> bien cac key do thanh mang
            const variables =  extractVariables(dto.expression);

            if(variables.length === 0 ){
                throw new BadRequestException('Expression must contain at least one metric variable')
            }

            //test cong thuc -> thay cac key metric thanh 1
            validateExpressionSyntax(dto.expression, variables);

            //lay cac key metric da ton tai trong workspace
            const existingMetrics = await this.prisma.metric.findMany({
                where:{
                    workspaceId: formula.workspaceId,
                    key:{
                        in: variables //chi lay cac key co xuat hien trong expression truyen vao
                    }            
                },
                select:{
                    key: true
                }
            })
        
            console.log(">>>>check key: ", existingMetrics);

            //tao danh sach key metric hop le
            const validKeys = new Set(existingMetrics.map(m=>m.key));

            //filter cai mang key metric, tung thang trong do 
            // neu khong co trong danh sach-> throw error
            const invalidKeys = variables.filter(variable => !validKeys.has(variable))

            if(invalidKeys.length > 0){
                throw new BadRequestException(`Some metrics in the expression do not exist: ${invalidKeys.join(', ')}`)
            }
        }   

        const formulaAfterUpdate = await this.prisma.formula.update({
            where:{
                id
            },
            data:{
                name: dto.name,
                expression: dto.expression,
                description: dto.description,
                version: dto.expression ? formula.version + 1 : formula.version,
            }
        })

        return this.prisma.formula.findUnique({
            where:{
                id: formulaAfterUpdate.id
            }
        });
    }

    async remove(id: string, user: AuthUser){
        const formula = await this.prisma.formula.findUnique({
            where:{
                id
            },
            include:{
                tasks:{
                    select:{
                        id:true
                    }
                }
            }
        })

        if(!formula){
            throw new NotFoundException('Formula not found');
        }

        await this.workspaceService.assertWorkspaceMember(formula.workspaceId, user.id);

        const taksUsing = await this.prisma.task.findMany({
            where:{
                formulaId: formula.id
            }
        })

        if(taksUsing.length > 0){
            throw new BadRequestException('This formula is being used by some tasks. Cannot delete!')
        }

        await this.prisma.formula.delete({
            where:{
                id
            }
        })
    }

    async assignToTask(formulaId: string, taskId: string, user: AuthUser){
        const formula = await this.prisma.formula.findUnique({
            where:{
                id: formulaId
            },
        })

        if(!formula){
            throw new NotFoundException('Formula not found');
        }

        const task = await this.taskService.findOne(taskId, user)

        const isSameWorkspace = formula.workspaceId === task.project.workspaceId

        if(!isSameWorkspace){
            throw new BadRequestException('Formula and task must be in the same workspace');
        }

        const isHasFomula = task.formula;

        if(isHasFomula){
            throw new BadRequestException('Task already has a formula');
        }   

        const taskAfterAssign = await this.prisma.task.update({
            where:{
                id: taskId
            },
            data:{
                formulaId
            },
            include:{
                formula: true
            }
        })

        return await this.prisma.task.findUnique({
            where: {
                id: taskAfterAssign.id,
            },
            include: {
                formula: true,
            },
        });
    }
}
