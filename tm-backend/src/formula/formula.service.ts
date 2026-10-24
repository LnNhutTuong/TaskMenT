import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFormulaDto } from './dto/create-formula.dto.js';
import { UpdateFormulaDto } from './dto/update-formula.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { WorkspaceService } from '../workspace/workspace.service.js';
import { FormulaEngineService } from '../formula-engine/formula-engine.service.js';
import { TaskService } from '../task/task.service.js';
import { PermissionService } from '../permission/permission.service.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';

@Injectable()
export class FormulaService {
    constructor(private readonly prisma: PrismaService, 
        private readonly workspaceService: WorkspaceService, 
        private readonly taskService: TaskService,
        private readonly permissionService: PermissionService,
        private readonly formulaEngineService: FormulaEngineService
    ){}

    async create(dto: CreateFormulaDto, user: AuthUser){
        await this.workspaceService.assertWorkspaceMember(dto.workspaceId, user.id)
        
        const variables = this.formulaEngineService.extractVariables(dto.expression);

        if(variables.length === 0 ){
            throw new BadRequestException('Expression must contain at least one metric variable')
        }

        this.formulaEngineService.validate(dto.expression);

        const existingMetrics = await this.prisma.metric.findMany({
            where:{
                workspaceId: dto.workspaceId,
                key:{
                    in: variables
                }        
            },
            select:{
                key: true
            }
        })

        const validKeys = new Set(existingMetrics.map(m=>m.key));
            
        const invalidKeys = variables.filter(variable => !validKeys.has(variable))

        if(invalidKeys.length > 0){
            throw new BadRequestException(`Some metrics in the expression do not exist: ${invalidKeys.join(', ')}`)
        }

        return this.prisma.formula.create({
            data:{
                workspaceId: dto.workspaceId,
                name: dto.name,
                expression: dto.expression,
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
        await this.permissionService.assertPermission(formula.workspaceId, user.id, PERMISSION_KEYS.FORMULA_UPDATE)
        if(dto.expression){
            const variables = this.formulaEngineService.extractVariables(dto.expression);

            if(variables.length === 0 ){
                throw new BadRequestException('Expression must contain at least one metric variable')
            }

            this.formulaEngineService.validate(dto.expression);

            const existingMetrics = await this.prisma.metric.findMany({
                where:{
                    workspaceId: formula.workspaceId,
                    key:{
                        in: variables
                    }            
                },
                select:{
                    key: true
                }
            })
        
            console.log(">>>>check key: ", existingMetrics);

            const validKeys = new Set(existingMetrics.map(m=>m.key));

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
        await this.permissionService.assertPermission(formula.workspaceId, user.id, PERMISSION_KEYS.FORMULA_DELETE)

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

        const isSameWorkspace = formula.workspaceId === task.workspaceId

        if(!isSameWorkspace){
            throw new BadRequestException('Formula and task must be in the same workspace');
        }

        await this.permissionService.assertPermission(formula.workspaceId, user.id, PERMISSION_KEYS.FORMULA_ASSIGN_TASK, task.project?.id)

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
