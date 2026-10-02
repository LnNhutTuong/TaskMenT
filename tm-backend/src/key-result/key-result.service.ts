import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateKeyResultDto } from './dto/create-key-result.dto.js';
import { UpdateKeyResultDto } from './dto/update-key-result.dto.js';
import { UpdateKeyResultProgressDto } from './dto/update-key-result-progress.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { WorkspaceService } from '../workspace/workspace.service.js';

@Injectable()
export class KeyResultService {

  constructor(private readonly prisma: PrismaService, private readonly workspaceService: WorkspaceService) {}

  async findAllByObjective(objId: string, user: AuthUser) {
    const objective = await this.prisma.objective.findUnique({
        where:{
          id: objId,
        },
        include:{
          workspace:{
            select:{
              members:{
                select:{
                  userId: true
                }
              }
          }
        }
      }
    })

    if(!objective){
      throw new NotFoundException('Objective not found')
    }

    await this.workspaceService.assertWorkspaceMember(objective.workspaceId, user.id)

    
    const [keyResults, total] = await Promise.all([this.prisma.keyResult.findMany({
      where:{
        objectiveId: objId
      },
      include:{
        taskLinks:{
          select:{
            task:{
              select:{
                id:true,
                title: true,
                status: true
              }
            }
          }
        }
      }
    }),
    this.prisma.keyResult.count({
      where:{
        objectiveId: objId
      }
    })
    ]) 

    return {keyResults, total};
  }

  async findOne(id: string, user: AuthUser) {
    const keyResult = await this.prisma.keyResult.findUnique({
        where:{
          id: id,
        },
        include:{
          objective:{
            select:{
              id:true, title: true, workspaceId: true
            },
          },
          taskLinks:{
            select:{
              task: {
                select:{
                  id:true,
                  title:true,
                  status:true
                }
              }
            }
          }
        }
      }
    )

    if(!keyResult){
      throw new NotFoundException('Key result not found')
    }

    await this.workspaceService.assertWorkspaceMember(keyResult.objective.workspaceId, user.id)
    
    return keyResult;
  }

  async create(dto: CreateKeyResultDto, user: AuthUser) {
    const objective = await this.prisma.objective.findUnique({
      where:{
        id: dto.objectiveId
      },
      include:{
        workspace:{
          select:{
            members:{
              select:{
                userId: true
              }
            }
          }
        }
      }
    })

    if(!objective){
      throw new NotFoundException('Objective not found');
    }

    await this.workspaceService.assertWorkspaceMember(objective.workspaceId, user.id)

    return this.prisma.keyResult.create({
      data:{
        objectiveId: objective.id,
        title: dto.title,
        description: dto.description,
        // startValue: dto.startValue,
        currentValue: dto.startValue ?? 0,
        targetValue: dto.targetValue,
        unit:  dto.unit
      }
    })
  } 

  async update(id: string, dto: UpdateKeyResultDto, user:AuthUser) {
    const keyResult = await this.prisma.keyResult.findUnique({
      where:{
        id
      },
      include:{
        objective:{
          select:{
            workspaceId:true
          }
        }
      }
    })
    
    if(!keyResult){
      throw new NotFoundException('Key result not found')
    }

    await this.workspaceService.assertWorkspaceMember(keyResult.objective.workspaceId, user.id)


    return this.prisma.keyResult.update({
      where:{
        id
      },
      data:{
        title: dto.title,
        description: dto.description,
        targetValue: dto.targetValue,
        unit: dto.unit
      }
    })
  }

  async updateProgress (id: string, dto: UpdateKeyResultProgressDto, user: AuthUser){
    const keyResult = await this.prisma.keyResult.findUnique({
      where:{
        id
      },include:{
        objective:{
          select:{
            workspaceId:true
          }
        }
      }

    })

    if(!keyResult){
      throw new NotFoundException('Key result not found');
    }

    await this.workspaceService.assertWorkspaceMember(keyResult.objective.workspaceId, user.id)

    if(dto.currentValue !== undefined){
      if(dto.currentValue < 0  || dto.currentValue >  keyResult.targetValue) {
        throw new BadRequestException('Current value must be between 0 and target value')
      }
    }

    await this.prisma.keyResult.update({
      where:{
        id
      },
      data:{
        currentValue: dto.currentValue
      }
    })

    return {currentValue: dto.currentValue, progress: Math.round((dto.currentValue / keyResult.targetValue) * 100) + " %"}
  }

  async remove(id:string, user:AuthUser) {
     const keyResult = await this.prisma.keyResult.findUnique({
      where:{
        id
      }, include:{
        objective:{
          select:{
            workspaceId:true
          }
        }
      }
    })
    
    if(!keyResult){
      throw new NotFoundException('Key result not found')
    }

    await this.workspaceService.assertWorkspaceMember(keyResult.objective.workspaceId, user.id)

    return this.prisma.keyResult.delete({
      where:{
        id: keyResult.id
      }
    })
  }

  

}
