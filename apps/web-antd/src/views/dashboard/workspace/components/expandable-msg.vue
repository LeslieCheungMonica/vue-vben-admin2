<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{ content: string }>();
const expanded = ref(false);
const LINE_HEIGHT = 20;
const MAX_LINES = 6;
const isLong = props.content.split('\n').length > MAX_LINES || props.content.length > 600;
</script>

<template>
  <div>
    <div
      class="whitespace-pre-wrap break-words text-xs text-gray-700 leading-5 transition-all duration-200"
      :class="expanded ? '' : 'line-clamp-6'"
    >
      {{ content }}
    </div>
    <button
      v-if="isLong"
      class="mt-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
      @click="expanded = !expanded"
    >
      {{ expanded ? '收起 ▲' : '展开 ▼' }}
    </button>
  </div>
</template>

<style scoped>
.line-clamp-6 {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
