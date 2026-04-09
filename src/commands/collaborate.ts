import type { Command } from '../commands.js'
import { executeShellCommandsInPrompt } from '../utils/promptShellExecution.js'
import { getModelStrings } from '../utils/model/modelStrings.js'

const ALLOWED_TOOLS = [
  'Agent',
  'SendMessage',
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
   - **强烈建议使用 \`name\` 参数** 为其命名（如 \`"researcher"\`, \`"coder"\`），这样你可以更方便地通过 \`to: "name"\` 与其通信。
   - **必须为每个 Agent 显式指定 \`model\` 参数**（只能是 \`"sonnet"\` / \`"opus"\` / \`"haiku"\` 三个枚举值之一，不是完整的模型 ID）。
   - **必须为每个 Agent 指定明确的职责范围和产出位置**。
   - **状态同步机制与实时通讯 (Crucial)**：
     - 拉起 Agent 时，**强烈建议开启 \`run_in_background: true\`** 并指示其任务目标，实现并发执行。
     - **消息通信 (SendMessage)**：你和子 Agent 之间不再只能依赖文件共享！你现在可以使用 \`SendMessage\` 工具与它们实时通信。
       - 使用 \`SendMessage\` 且 \`to: "agentId"\` （Agent 启动后返回的内部 ID）给特定 Agent 派发新任务或询问进度。
       - 子 Agent 也会被赋予 \`SendMessage\` 能力，它们会主动向你汇报中间状态、请求审核或交付最终结果。
       - 你必须在拉起 Agent 的 Prompt 中**明确告诉它们**：“完成后请使用 SendMessage 工具将结果汇报给我”。
     - **消息中枢机制**：你作为 team-lead 需要承担消息中枢的作用。子 Agent 之间可能不知道彼此的存在，但你可以将一个 Agent 的输出通过 SendMessage 传递给另一个 Agent。
   - **红线约束**：**前端设计类任务** 严禁使用任何 \`gpt\` 系列模型（如果列表包含）。应优先使用 \`"sonnet"\`。
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
