<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-[clamp(16px,3vw,24px)] px-6 text-center">
    <div class="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
      <i class="fas fa-compass text-primary" style="font-size: 2.5rem" />
    </div>

    <h1 class="text-heading-sm md:text-heading-pc font-bold text-ink">找不到此頁面</h1>
    <p class="text-body text-muted">很抱歉，您要瀏覽的頁面不存在。</p>

    <button
      class="bg-primary text-white text-button font-medium rounded-full px-7 py-2.5 flex items-center gap-2"
      @click="router.push('/')"
    >
      <i class="fas fa-arrow-left" />
      返回首頁
    </button>
  </div>
</template>
