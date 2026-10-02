import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkflowDto } from './dto/create-workflow.dto.js';
import { UpdateWorkflowDto } from './dto/update-workflow.dto.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectService } from '../project/project.service.js';

@Injectable()
export class WorkflowService {

  constructor(private readonly prisma: PrismaService, private readonly projectService: ProjectService){}

  async create(dto: CreateWorkflowDto, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where:{
        id: dto.projectId
      },
      include:{
        workflow:{
          select:{
            id:true
          }
        }
      }
    })
    //check project
    if(!project){
      throw new NotFoundException('Project not found')
    } 

    //check project member
    await this.projectService.assertProjectMember(project.id, user.id)

    //check workflow trong project do
    if(project.workflow?.id){
      throw new BadRequestException('This project already has a workflow')
    }

    //check step
    if(!dto.steps.length){
      throw new BadRequestException('Workflow must have at least one step')
    }

    //check step initial
    const hasIntinital = dto.steps.some(step => step.isInitial === true)

    if(!hasIntinital){
      throw new BadRequestException('Workflow must have at least one initial step')
    }

    //check step final
    const hasFinal = dto.steps.some(step => step.isFinal === true)
    
    if(!hasFinal){
      throw new BadRequestException('Workflow must have at least one final step')
    }

    //check name step phai la unique
    const stepNames = dto.steps.map(step => step.name);
    const uniqueStepNames = new Set(stepNames);

    if(uniqueStepNames.size !== stepNames.length){
      throw new BadRequestException('Step names must be unique')  
    } 
  
    //check transition, dung for vi cai do gui cai mang di
    for (const transition of dto.transitions ?? []){
      if(!uniqueStepNames.has(transition.fromStepName)){
        throw new BadRequestException(`Step "${transition.fromStepName}" does not exist`)
      } 
      if(!uniqueStepNames.has(transition.toStepName)){
        throw new BadRequestException(`Step "${transition.toStepName}" does not exist`)
      } 
    }

    //tao 1 lan 3 cai bang transaction
    const result = await this.prisma.$transaction(async (tx) => {
      //tao workflow
      const workflow = await tx.workflow.create({
        data:{
          projectId: project.id,
          name: dto.name
        }
      })

      //tao step
      await tx.workflowStep.createMany({
        data:
          dto.steps.map((step, index)=> ({
            workflowId: workflow.id,
            name: step.name,
            label: step.label,
            isInitial: step.isInitial ?? false,
            isFinal: step.isFinal ?? false,
            color: step.color,
            order: step.order ?? index
          }))
        })

        //lay lai may thang vua tao
        const createdSteps = await tx.workflowStep.findMany({
          where:{
            workflowId: workflow.id
          },
          select:{
            id:true,
            name:true
          }
        })

        //tao mot cai map voi value name, index id
        const stepMap = new Map(createdSteps.map(s => [s.name, s.id]))
          
        await tx.workflowTransition.createMany({
          data: dto.transitions.map(t => ({
            workflowId: workflow.id,
            fromStepId: stepMap.get(t.fromStepName)!,
            toStepId: stepMap.get(t.toStepName)!,
            label: t.label
          }))
        })

        //return lai workflow cung steps, transitions
        return tx.workflow.findUnique({
          where:{
            id: workflow.id
          },
          include:{
            steps:{
              orderBy:{
                order: 'asc'
              } 
            },
            transitions: true
          }
        })
    })
    return result
  }

  async findByProject(projectId: string, user: AuthUser){

    const project = await this.prisma.project.findUnique({
      where:{
        id: projectId
      }
    })

    if(!project){
      throw new NotFoundException('Project not found')
    }

    await this.projectService.assertProjectMember(projectId, user.id)

    const workflow = await this.prisma.workflow.findUnique({
      where:{
        projectId
      },
      include:{
        steps:{
          orderBy:{
            order: 'asc'
          }
        },
        transitions: true
      }
    })

    if(!workflow){
      throw new NotFoundException('Not found workflow in this project')
    }

    return workflow
    
  }

  async getValidTransitions(projectId: string, currentStatus: string, user: AuthUser){

    //tim workflow
    const workflow = await this.prisma.workflow.findUnique({
      where:{
        projectId
      },
      include:{
        steps:{
          orderBy:{
            order:'asc'
          }
        },
        transitions:{
          select:{
            toStep:true,
            fromStepId: true
          }
        }
      }
    })
    

    if(!workflow) return []

    //check project member
    await this.projectService.assertProjectMember(projectId, user.id)

    //tim current step
    const currentStep = workflow.steps.find(step => 
      step.name === currentStatus
    )

    if(!currentStep) return [];

    // Lọc transitions có fromStepId trùng với step hiện tại
    // Rồi map ra danh sách toStep
    const validNextSteps = workflow.transitions
      .filter(t => t.fromStepId === currentStep.id)
      .map(t => t.toStep);

    return validNextSteps;
  }

  async assertValidTransition(
    projectId: string,
    fromStatus: string,
    toStatus: string,
  ) {
    const workflow = await this.prisma.workflow.findUnique({
      where: {
        projectId,
      },
      include: {
        steps: {
          orderBy: {
            order: 'asc',
        },
      },
        transitions: true,
      },
    });

    if (!workflow) return;

    // Không thay đổi status
    if (fromStatus === toStatus) {
      return;
    }

    const fromStep = workflow.steps.find(
      step => step.name === fromStatus,
    );

    const toStep = workflow.steps.find(
      step => step.name === toStatus,
    );

    // Status không tồn tại trong workflow
    if (!toStep) {
      throw new BadRequestException(`Status "${toStatus}" is not valid in this workflow`);
    }
    if (!fromStep) {
      throw new BadRequestException(`Current status "${fromStatus}" is not valid in this workflow`);
    }

    // Kiểm tra transition có tồn tại không
    const isAllowed = workflow.transitions.some(
      transition =>
        transition.fromStepId === fromStep.id &&
        transition.toStepId === toStep.id,
    );

    if (!isAllowed) {
      throw new BadRequestException(
        `Cannot transition from "${fromStatus}" to "${toStatus}"`,
      );
    }
  }
}
