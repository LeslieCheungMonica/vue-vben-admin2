<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = defineProps<{ webId: string }>();

const loading = ref(true);
const errorMsg = ref('');
const htmlUrl = ref<string | null>(null);

async function replaceImagesWithBase64(html: string): Promise<string> {
  let result = html;
  result = result.replace(/<script[\s\S]*?<\/script>/gi, '');
  result = result.replace(
    /(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi,
    '$1=""',
  );
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const matches = [...result.matchAll(imgRegex)];
  if (!matches.length) return result;
  const replacements = await Promise.all(
    matches.map(async ([, src = '']) => {
      try {
        const resp = await fetch('/api/wape/image_to_base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ relative_path: src, task_id: props.webId }),
        });
        if (!resp.ok) return { src, base64: src };
        const data = await resp.json();
        const ext = src.toLowerCase().split('.').pop();
        const mime =
          ext === 'png'
            ? 'image/png'
            : ext === 'jpg' || ext === 'jpeg'
              ? 'image/jpeg'
              : ext === 'gif'
                ? 'image/gif'
                : 'image/svg+xml';
        return {
          src,
          base64: data.base64 ? `data:${mime};base64,${data.base64}` : src,
        };
      } catch {
        return { src, base64: src };
      }
    }),
  );
  for (const { src, base64 } of replacements) {
    result = result.replaceAll(src, base64);
  }
  return result;
}

async function loadData() {
  loading.value = true;
  errorMsg.value = '';
  htmlUrl.value = null;
  try {
    let url = `/api/wape/survey_report_html/${props.webId}?time=${new Date().getTime()}`;
    let resp = await fetch(url);
    if (!resp.ok) {
      url = `/api/wape/survey_report_html/${props.webId}/?time=${new Date().getTime()}`;
      resp = await fetch(url);
    }
    if (!resp.ok) throw new Error('业务架构报告获取失败');
    let text = await resp.text();
    text = await replaceImagesWithBase64(text);
    text = text.replace(
      '<head>',
      '<head><meta http-equiv="Content-Security-Policy" content="script-src-attr \'none\'; script-src \'unsafe-inline\' \'self\' https://cdn.jsdelivr.net; img-src \'self\' data:;"><style>body{font-size:10px!important;line-height:1.5!important;}</style><script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script><script>document.querySelectorAll("pre>code.language-mermaid").forEach(function(c){var p=c.parentElement,d=document.createElement("div");d.className="mermaid";d.textContent=c.textContent;p.parentNode.replaceChild(d,p)});var t=setInterval(function(){if(typeof mermaid!=="undefined"){clearInterval(t);mermaid.run({nodes:document.querySelectorAll(".mermaid")})}},100);<\/script>',
    );
    htmlUrl.value = text;
  } catch (err: any) {
    errorMsg.value = err.message || '业务架构加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="relative h-full w-full bg-[#0d1117]">
    <div
      v-if="loading"
      class="flex h-full flex-col items-center justify-center gap-3"
    >
      <div
        class="size-8 animate-spin rounded-full border-[3px] border-gray-700 border-t-blue-500"
      />
      <span class="text-sm text-gray-400">正在加载业务架构…</span>
    </div>

    <div
      v-else-if="errorMsg"
      class="flex h-full flex-col items-center justify-center gap-2 px-6"
    >
      <div class="text-4xl">🏗️</div>
      <p class="text-sm text-red-400">{{ errorMsg }}</p>
    </div>

    <iframe
      v-else-if="htmlUrl"
      :srcdoc="htmlUrl"
      class="h-full w-full border-0"
    />

    <div
      v-else
      class="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-500"
    >
      <div class="text-4xl">🏗️</div>
      <span>暂无业务架构数据</span>
    </div>
  </div>
</template>
