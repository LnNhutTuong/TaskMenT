import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SubmitEvidenceDto } from './dto/submit-evidence.dto.js';
import { ReviewEvidenceDto } from './dto/review-evidence.dto.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaskOutputService } from '../task-output/task-output.service.js';
import { ProjectService } from '../project/project.service.js';
import { TaskService } from '../task/task.service.js';

@Injectable()
export class EvidenceService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly taskOutputService: TaskOutputService,
        private readonly projectService: ProjectService,
        private readonly taskService: TaskService
    ){}

    async submit(dto: SubmitEvidenceDto, user: AuthUser){
        //tim taskoutput
        const taskOutput = await this.taskOutputService.findOne(dto.taskOutputId, user);
        
        //tim task va check can view
        const task = await this.taskService.findOne(taskOutput.taskId, user);

        //check project member
        await this.projectService.assertProjectMember(task.project.id, user.id);

        const submitted = await this.prisma.evidence.create({
            data:{
                taskOutputId: taskOutput.id,
                fileUrl: dto.fileUrl,
                fileName: dto.fileName,
                mimeType: dto.mimeType,
                uploadedById: user.id,
                uploadedAt: new Date()
            }
        })

        return this.prisma.evidence.findUnique({
            where:{
                id: submitted.id
            },
            omit:{
                taskOutputId: true, uploadedById: true, reviewedById: true
            },include:{
                taskOutput:{
                    select:{
                        id: true,
                        title: true    
                    }
                },uploadedBy:{
                    select:{
                        id:true,
                        name: true
                    }
                },
                reviewedBy:{
                    select:{
                        id: true,
                        name: true
                    }
                }
            }
        })
    }

    async review(id: string, dto: ReviewEvidenceDto, user: AuthUser){
        const evidence = await this.prisma.evidence.findUnique({
            where:{
                id  
            },
            include:{
                taskOutput:{
                    select:{
                        task:{
                            select:{
                                createdById: true, // thang giao task
                                project:{
                                    select:{
                                        createdById: true // thang owner project
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if(!evidence){
            throw new NotFoundException('Evidence not found');
        }

        const task = evidence.taskOutput.task;

        if (evidence.uploadedById === user.id) {
            throw new ForbiddenException('You cannot review your own evidence');
        }

        const isReviewer = (user.id === task.project.createdById) || (user.id === task.createdById); 

        if(!isReviewer){
            throw new ForbiddenException('You dont have permission to review this evidence');
        }

        const evidenceAfterUpdate = await this.prisma.evidence.update({
            where:{
                id: evidence.id
            },
            data:{
                status: dto.status,
                reviewedById: user.id,
                reviewNote: dto.reviewNote,
                reviewedAt: new Date()
            }
        })


        return this.prisma.evidence.findUnique({
            where:{
                id: evidenceAfterUpdate.id
            },
            omit:{
                taskOutputId: true, uploadedById: true, reviewedById: true
            },
            include:{
                uploadedBy:{
                    select:{
                        id: true,
                        name: true
                    }
                },
                reviewedBy:{
                    select:{
                        id: true,
                        name: true,
                    }
                },
                taskOutput:{
                    select:{
                        id: true,
                        title: true,
                        task:{
                            select:{
                                id: true,
                                title: true
                            }
                        }
                    },
                }
                
            }
        })
    }

    async findByTaskOutput(taskOutputId: string, user: AuthUser){

        const taskOutput = await this.taskOutputService.findOne(taskOutputId, user);

        const evidence = await this.prisma.evidence.findMany({
            where:{
                taskOutputId: taskOutput.id
            },
            omit:{
                taskOutputId: true, uploadedById: true, reviewedById: true
            },
            include:{
                 taskOutput:{
                    select:{
                        id: true,
                        title: true,
                        task:{
                            select:{
                                id: true,
                                title: true
                            }
                        }
                    },
                },
                uploadedBy:{
                    select:{
                        id: true,
                        name: true
                    }
                },
                reviewedBy:{
                    select:{
                        id: true,
                        name: true,
                    }
                },
            }
        })
        
        if(!evidence.length) return []

        return evidence;
    }

    async remove(id: string, user:AuthUser){
        const evidence = await this.prisma.evidence.findUnique({
            where:{
                id,
            }
        })

        if(!evidence){
            throw new NotFoundException('Evidence not found');
        }

        if(evidence.status !== "PENDING"){
            throw new BadRequestException('This evidence has been reviewed');
        }

        if(evidence.uploadedById !== user.id){
            throw new ForbiddenException('You dont have permission to delete this evidence');
        }

        await this.prisma.evidence.delete({
            where:{
                id
            }
        })
    }
}
