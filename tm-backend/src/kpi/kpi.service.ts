import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { TaskService } from '../task/task.service.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { FormulaEngineService } from '../formula-engine/formula-engine.service.js';

@Injectable()
export class KpiService {  

  constructor (
    private readonly prisma: PrismaService,
    private readonly taskService: TaskService,
    private readonly formulaEngineService: FormulaEngineService
  ) {}

  async findOne(taskId: string, user:AuthUser) {
    const task = await this.taskService.findOne(taskId, user)

    if(!task){
      throw new NotFoundException(`Task not found`)
    }

    return this.prisma.task.findUnique({
      where:{
        id: task.id
      },
      select:{
        id: true,
        title: true,
        kpiSnapshot:true
      }
    })
  }  

  async caculatorKpi (taskId: string, user: AuthUser){
    const task = await this.prisma.task.findUnique({
      where:{
        id: taskId
      },
      include:{
        formula: true,
        taskMetricValues:{
          include:{
            metric:true
          }
        }
      }
    })

    if(!task){
      throw new NotFoundException('Task not found');
    }

    await this.taskService.assertTaskPermission(task.id, user.id)

    if(!task.formula){
      throw new BadRequestException('This task has not formula assigned')
    }

    // tao variables 
    const variables: Record<string, number> = {};
    for(const tmv of task.taskMetricValues){
      variables[tmv.metric.key] = tmv.value;
    }

    //check variable trong expression
    //lay bien can thiet trong bieu thuc cong thuc
    const requiredVariable = await this.formulaEngineService.extractVariables(task.formula.expression)
    //filter nhung thang trong required nhung lai ko co trong variables -> nhung thang missing 
    const missingVariables = requiredVariable.filter(variable => !(variable in variables))

    if(missingVariables.length > 0){
      throw new BadRequestException(`Missing metric value: ${missingVariables.join(', ')}`)
    }
    

    //truyen bieu thuc cong thuc, variables vao trong evaluate
    const score = this.formulaEngineService.evaluate(task.formula.expression, variables)
    
    return this.prisma.kPISnapshot.upsert({
      where:{
        taskId
      },
      create:{
        taskId, finalScore: score,
        expression: task.formula.expression,
        version: task.formula.version,
        metricValues: variables
      },update:{
        finalScore: score,
        expression: task.formula.expression,
        version: task.formula.version,
        metricValues: variables
      }
    })

  }
}
