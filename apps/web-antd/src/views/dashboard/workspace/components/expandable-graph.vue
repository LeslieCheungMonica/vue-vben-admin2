<template>
  <div
    class="thought-chain-container"
    :style="{
      width: '100%',
      '--theme-color': themeColor,
      '--theme-glow': themeGlow,
      background: bgColor,
      borderColor: `${themeColor}33`,
      boxShadow: `0 0 30px ${themeGlow}08, inset 0 1px 0 ${themeGlow}1a`
    }"
  >
    <!-- 标题 -->
    <div class="header">
      <h3 class="title">
        <span class="title-icon">◆</span>
        {{ title }}
      </h3>
      <div class="legend">
        <div class="legend-item">
          <span class="dot dot-completed" />
          <span>已完成</span>
        </div>
        <div class="legend-item">
          <span class="dot dot-running">
            <span class="dot-pulse" />
          </span>
          <span>进行中</span>
        </div>
        <div class="legend-item">
          <span class="dot dot-pending" />
          <span>待执行</span>
        </div>
      </div>
    </div>

    <!-- 流程图区域 -->
    <div class="flow-wrapper">
      <div class="grid-bg" :style="{ backgroundSize: gridSize }" />

      <svg
        :viewBox="`0 0 ${viewBox.width} ${viewBox.height}`"
        class="flow-svg"
      >
        <defs>
          <!-- 流动光效渐变 -->
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" :stop-color="`${themeGlow}1a`" />
            <stop offset="50%" :stop-color="`${themeGlow}cc`" />
            <stop offset="100%" :stop-color="`${themeGlow}1a`" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 连线 -->
        <g v-for="(edge, idx) in chainData.edges" :key="'edge-' + idx">
          <!-- 底层线 -->
          <path
            :d="getPathD(edge)"
            fill="none"
            :stroke="isEdgeActive(edge) ? `${themeGlow}4d` : `${themeGlow}1a`"
            stroke-width="2"
          />
          <!-- 流动光点 -->
          <path
            v-if="isEdgeActive(edge)"
            :d="getPathD(edge)"
            fill="none"
            stroke="url(#flowGradient)"
            stroke-width="2"
            stroke-dasharray="20 80"
            filter="url(#glow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-100"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </path>
          <!-- 箭头 -->
          <circle
            :cx="getEndPoint(edge).x - 2"
            :cy="getEndPoint(edge).y"
            r="3"
            :fill="isEdgeActive(edge) ? themeGlow : `${themeGlow}4d`"
          />
        </g>

        <!-- 节点 -->
        <g
          v-for="(node, i) in chainData.nodes"
          :key="node.id"
          :transform="`translate(${node.x}, ${node.y})`"
          :style="{ opacity: getStatusOpacity(node.status) }"
        >
          <!-- 脉冲圈 (运行中) -->
          <circle
            v-if="node.status === 'running'"
            cx="70"
            cy="25"
            r="28"
            fill="none"
            :stroke="getNodeColors(node.type).glow"
            stroke-width="1"
            opacity="0.5"
          >
            <animate attributeName="r" from="25" to="40" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>

          <!-- 节点外框 -->
          <rect
            x="0"
            y="0"
            width="140"
            height="50"
            rx="6"
            :fill="getNodeColors(node.type).bg"
            :stroke="getNodeBorderColor(node)"
            :stroke-width="node.status === 'running' ? 2 : 1"
            :filter="(node.status === 'running' || node.status === 'completed') ? 'url(#glow)' : undefined"
          />

          <!-- 节点图标 -->
          <circle
            cx="22"
            cy="25"
            r="10"
            fill="transparent"
            :stroke="node.status === 'completed' ? completedColor : getNodeColors(node.type).glow"
            stroke-width="1.5"
          />
          <text
            x="22"
            y="29"
            text-anchor="middle"
            font-size="10"
            :fill="node.status === 'completed' ? completedColor : getNodeColors(node.type).text"
            font-weight="bold"
          >
            {{ getNodeIcon(node.type) }}
          </text>

          <!-- 节点文字 -->
          <text
            x="40"
            y="23"
            font-size="12"
            :fill="getNodeTextColor(node)"
            :font-weight="node.status === 'running' ? '600' : '400'"
          >
            {{ node.label }}
          </text>
          <text
            x="40"
            y="38"
            font-size="9"
            :fill="`${themeGlow}66`"
          >
            Step {{ i + 1 }} · {{ node.type }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ========== 类型定义 ==========
export interface ThoughtChainNode {
  id: string
  label: string
  type: 'input' | 'process' | 'decision' | 'output'
  status: 'completed' | 'running' | 'pending'
  x: number
  y: number
}

export interface ThoughtChainData {
  nodes: ThoughtChainNode[]
  edges: { from: string; to: string }[]
}

// ========== Props ==========
interface Props {
  chainData: ThoughtChainData
  title?: string
  themeColor?: string   // 主题色（边框、文字）
  themeGlow?: string    // 发光色
  bgColor?: string      // 容器底色
  completedColor?: string // 已完成状态色
  gridSize?: string     // 网格背景大小
}

const props = withDefaults(defineProps<Props>(), {
  title: '任务执行流程 / 思维链',
  themeColor: '#00e0ff',
  themeGlow: '#00e0ff',
  bgColor: 'linear-gradient(135deg, hsla(220, 35%, 10%, 0.8), hsla(220, 40%, 6%, 0.8))',
  completedColor: '#00ff9d',
  gridSize: '20px 20px'
})

// ========== 节点颜色配置 ==========
const nodeColorMap: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  input:    { bg: 'rgba(0, 224, 255, 0.15)',   border: 'rgba(0, 224, 255, 0.6)',   glow: '#00e0ff', text: '#00e0ff' },
  process:  { bg: 'rgba(77, 148, 255, 0.15)',  border: 'rgba(77, 148, 255, 0.6)',  glow: '#4d94ff', text: '#4d94ff' },
  decision: { bg: 'rgba(124, 110, 255, 0.15)', border: 'rgba(124, 110, 255, 0.6)', glow: '#7c6eff', text: '#7c6eff' },
  output:   { bg: 'rgba(0, 255, 157, 0.15)',   border: 'rgba(0, 255, 157, 0.6)',   glow: '#00ff9d', text: '#00ff9d' },
}

const statusOpacityMap: Record<string, number> = {
  completed: 1,
  running: 1,
  pending: 0.4,
}

// ========== 计算属性 ==========
const viewBox = computed(() => {
  const maxX = Math.max(...props.chainData.nodes.map(n => n.x)) + 100
  const maxY = Math.max(...props.chainData.nodes.map(n => n.y)) + 80
  return { width: maxX, height: maxY }
})

const nodeMap = computed(() => {
  const map: Record<string, ThoughtChainNode> = {}
  props.chainData.nodes.forEach(n => { map[n.id] = n })
  return map
})

// ========== 方法 ==========
function getNodeColors(type: string) {
  return nodeColorMap[type] || nodeColorMap.process
}

function getStatusOpacity(status: string) {
  return statusOpacityMap[status] ?? 1
}

function getNodeIcon(type: string) {
  const icons: Record<string, string> = {
    input: '▶',
    output: '■',
    decision: '◆',
    process: '⚙'
  }
  return icons[type] || '⚙'
}

function getNodeBorderColor(node: ThoughtChainNode) {
  if (node.status === 'completed') return props.completedColor
  if (node.status === 'running') return getNodeColors(node.type).glow
  return getNodeColors(node.type).border
}

function getNodeTextColor(node: ThoughtChainNode) {
  if (node.status === 'completed') return props.completedColor
  if (node.status === 'running') return props.themeGlow
  return `${props.themeGlow}80`
}

function getPathD(edge: { from: string; to: string }) {
  const from = nodeMap.value[edge.from]
  const to = nodeMap.value[edge.to]
  if (!from || !to) return ''

  const startX = from.x + 70
  const startY = from.y + 25
  const endX = to.x
  const endY = to.y + 25
  const midX = (startX + endX) / 2

  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`
}

function getEndPoint(edge: { from: string; to: string }) {
  const to = nodeMap.value[edge.to]
  return { x: to?.x ?? 0, y: (to?.y ?? 0) + 25 }
}

function isEdgeActive(edge: { from: string; to: string }) {
  const from = nodeMap.value[edge.from]
  const to = nodeMap.value[edge.to]
  if (!from || !to) return false
  return from.status === 'completed' && (to.status === 'running' || to.status === 'completed')
}
</script>

<style scoped>
.thought-chain-container {
  position: relative;
  /* overflow: hidden; */
  /* border-radius: 12px;
  border: 1px solid; */
  padding: 20px;
  backdrop-filter: blur(4px);
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 角落装饰 */
/* .corner {
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
}
.corner-tl { top: 0; left: 0; border-left: 1px solid; border-top: 1px solid; border-color: color-mix(in srgb, var(--theme-color) 60%, transparent); }
.corner-tr { top: 0; right: 0; border-right: 1px solid; border-top: 1px solid; border-color: color-mix(in srgb, var(--theme-color) 60%, transparent); }
.corner-bl { bottom: 0; left: 0; border-left: 1px solid; border-bottom: 1px solid; border-color: color-mix(in srgb, var(--theme-color) 60%, transparent); }
.corner-br { bottom: 0; right: 0; border-right: 1px solid; border-bottom: 1px solid; border-color: color-mix(in srgb, var(--theme-color) 60%, transparent); } */

/* 头部 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--theme-color);
  margin: 0;
}

.title-icon {
  margin-right: 8px;
  opacity: 0.8;
}

/* 图例 */
.legend {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: color-mix(in srgb, var(--theme-color) 40%, transparent);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-completed {
  background: #00ff9d;
  box-shadow: 0 0 6px #00ff9d;
}

.dot-running {
  position: relative;
  background: var(--theme-color);
}

.dot-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--theme-color);
  animation: dotPulse 1.5s ease-out infinite;
}

@keyframes dotPulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

.dot-pending {
  background: color-mix(in srgb, var(--theme-color) 30%, transparent);
}

/* 流程图区域 */
.flow-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--theme-color) 10%, transparent);
  background: hsla(220, 40%, 5%, 0.5);
  padding: 16px;
}

.grid-bg {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  background-image:
    linear-gradient(color-mix(in srgb, var(--theme-glow) 5%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--theme-glow) 5%, transparent) 1px, transparent 1px);
}

.flow-svg {
  position: relative;
  width: 100%;
  height: 200px;
}
</style>
