<script setup>
import { useRouter } from 'vue-router'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

const router = useRouter()

</script>

<template>
  <div class="relative h-screen bg-bg-base flex flex-col">

    <!-- Lottie 動畫背景 -->
    <DotLottieVue
      src="https://lottie.host/8f28e7bb-34e2-48fd-b8a4-3669dea6d2e9/NNs77bJIOB.lottie"
      :autoplay="true"
      :loop="true"
      class="absolute inset-0 w-full h-full opacity-50 pointer-events-none"
    />

    <!-- 主要內容 -->
    <main class="relative z-10 flex-1 flex flex-col items-center justify-center pb-[clamp(250px,20vw,288px)] gap-[clamp(24px,3vw,32px)] px-6 text-center">

      <!-- Eyebrow -->
      <span class="inline-block px-4 py-1 rounded-full border text-label font-light text-primary border-secondary">
        Taiwan Travel
      </span>

      <!-- 標題區 -->
      <div class="flex flex-col gap-2">
        <h1 class="text-heading-sm md:text-heading-pc font-bold text-ink">
          探索台灣旅遊景點
        </h1>
        <p class="text-subheading-sm md:text-subheading-pc font-normal text-muted">
          發掘你未曾發現的台灣之美
        </p>
      </div>

      <!-- 特色膠囊標籤列 -->
      <div class="flex flex-wrap justify-center gap-[clamp(12px,2vw,16px)]">
        <span
          class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm text-label text-ink border border-border-soft">
          <i class="fas fa-map text-primary"></i>互動地圖
        </span>
        <span
          class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm text-label text-ink border border-border-soft">
          <i class="fas fa-location-dot text-primary"></i>收藏景點
        </span>
        <span
          class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm text-label text-ink border border-border-soft">
          <i class="fas fa-compass text-primary"></i>探索縣市
        </span>
      </div>

      <!-- 開始探索按鈕 -->
      <button
        class="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white text-button font-medium hover:bg-secondary transition-colors duration-200"
        @click="router.push('/map')">
        開始探索
        <i class="fas fa-arrow-right"></i>
      </button>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 py-4 text-center bg-white/50 backdrop-blur-sm">
      <p class="text-label font-light text-muted">
        © {{ new Date().getFullYear() }} Brian. All rights reserved.
      </p>
    </footer>

  </div>
</template>

<style scoped>

</style>
