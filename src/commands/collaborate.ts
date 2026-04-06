import type { Command } from '../commands.js'
import { executeShellCommandsInPrompt } from '../utils/promptShellExecution.js'
import { getModelStrings } from '../utils/model/modelStrings.js'

const ALLOWED_TOOLS = [
  'Agent',
  'Bash(*)',
  'Read(*)',
  'Grep(*)',
  'Glob(*)',
]

function getCollaboratePrompt(userPrompt: string, availableModels: string): string {
  return `## 战略背景 (Strategic Context)

你现在是【多模型协作系统 (Multi-Model Collaboration System)】的高级指挥官。

## 核心资源矩阵 (Resource Matrix)

以下是当前系统可用的模型池（战略资产）：
${availableModels}

## 你的目标 (Mission Objectives)

1. **任务洞察**：分析用户请求：\n   > "${userPrompt}"
2. **协作矩阵设计**：根据任务复杂度，从上述模型池中选择最匹配的模型。
   - **Opus 系列**：适合处理极其复杂的逻辑推理、架构设计或大规模重构。
   - **Sonnet 系列**：适合日常开发、代码实现和常规任务。
   - **Haiku 系列**：适合快速检索、简单文档、单元测试生成或琐碎任务。
3. **分发执行 (Distribution)**：
   - 必须通过调用 \`Agent\` 工具拉起子任务模型。
   - **必须为每个 Agent 显式指定 \`model\` 参数**（填入模型矩阵中的 ID）。
   - 每个 \`Agent\` 应分配清晰的职责范围。
   - **红线约束**：**前端设计类任务** 严禁使用任何 \`gpt\` 系列模型（如果列表包含）。应优先使用 \`claude-sonnet-4-6\`。
4. **结果闭环 (Closure)**：整合所有子模型交付的结果，形成完整的战略报告交付给用户。

## 执行指令 (Execution)

1. 首先通过内部思考 (Thinking) 制定详细的作战计划（包含模型选择理由）。
2. 并行拉起所需的 \`Agent\`（最多 4 个，最少 1 个）。
3. 统筹汇总，交付成果。

请立即开启你的“模型联合作战模式”。`
}

const command: Command = {
  type: 'prompt',
  name: 'collaborate',
  aliases: ['collab', '多模型协作'],
  description: 'Initiate a multi-model collaboration for a given task',
  allowedTools: ALLOWED_TOOLS,
  contentLength: 0,
  progressMessage: 'organizing multi-model collaboration',
  source: 'builtin',
  async getPromptForCommand(args, context) {
    // 动态获取当前环境下的全量模型列表
    const modelStrings = getModelStrings()
    const availableModels = Object.entries(modelStrings)
      .map(([key, id]) => `- **${key}**: \`${id}\``)
      .join('\n')

    const collaboratePrompt = getCollaboratePrompt(args, availableModels)
    
    const finalContent = await executeShellCommandsInPrompt(
      `## Current Git Status\n!\`git status\`\n\n${collaboratePrompt}`,
      context,
      '/collaborate'
    )

    return [{ type: 'text', text: finalContent }]
  },
}

export default command
