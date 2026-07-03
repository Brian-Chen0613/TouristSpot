<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { spots } from '@/data/spotData.js'
import { useFavorites } from '@/composables/useFavorites.js'

const route = useRoute()
const router = useRouter()
const { isFavorite, toggleFavorite } = useFavorites()

const spot = computed(() => spots.find((s) => s.id === route.params.spotId) ?? null)

const cityName = computed(() => spot.value?.cityName ?? '')

const goToOtherSpots = () => {
  const citySpots = spots.filter((s) => s.city === route.params.city)
  if (citySpots.length) {
    router.push('/map/' + route.params.city)
  } else {
    router.push('/map')
  }
}

const showGoTop = ref(false)
const handleScroll = () => {
  showGoTop.value = window.scrollY > 300
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div v-if="spot" class="spot-bg min-h-screen w-full ">
    <header class="bg-bg-base flex px-[clamp(16px,4vw,40px)] pt-[clamp(16px,3vw,24px)] pb-[clamp(12px,2vw,16px)]">
      <div class="max-w-[1300px] mx-auto w-full flex items-center justify-between">
        <button class="text-button font-medium text-primary flex items-center gap-2"
          @click="router.push('/map/' + route.params.city)">
          <i class="fas fa-arrow-left"></i>
          返回 {{ cityName }}
        </button>
        <button
          class="text-button font-medium text-muted flex items-center gap-2 hover:text-primary transition-colors duration-200"
          @click="router.push('/map')">
          返回地圖
          <i class="fas fa-map"></i>
        </button>
      </div>
    </header>

    <div class="max-w-[1300px] mx-auto w-full">
      <div
        class="flex flex-col md:flex-row gap-[clamp(24px,4vw,48px)] px-[clamp(16px,4vw,40px)] py-[clamp(24px,4vw,48px)]">
        <div class="w-full md:w-[480px] shrink-0">
          <img v-if="spot.images[0]" :src="spot.images[0]" :alt="spot.name"
            class="w-full aspect-[4/3] md:aspect-[1] object-cover rounded-xl" />
          <div v-else
            class="w-full aspect-[4/3] md:aspect-[2/3] rounded-xl bg-border-soft flex items-center justify-center">
            <i class="fas fa-image text-muted" style="font-size: 2rem"></i>
          </div>
        </div>

        <div class="min-w-0 flex-1 flex flex-col gap-[clamp(16px,3vw,24px)] justify-center">
          <div class="flex flex-col gap-2">
            <h1 class="text-heading-sm md:text-heading-pc font-bold text-ink">{{ spot.name }}</h1>
            <div class="flex items-center justify-between gap-2">
              <span class="self-start px-3 py-1 rounded-full bg-primary/10 text-label text-primary">
                {{ spot.category }}
              </span>
              <button :class="isFavorite(spot.id) ? 'text-danger' : 'text-muted'" @click="toggleFavorite(spot.id)">
                <i class="fas fa-heart" style="font-size: 1.5rem"></i>
              </button>
            </div>
          </div>

          <hr class="border-border-soft" />

          <p class="text-body text-ink leading-relaxed">{{ spot.description }}</p>

          <hr class="border-border-soft" />

          <div class="flex flex-col gap-3">
            <div class="flex items-start gap-3">
              <div class="w-5 shrink-0 flex justify-center pt-0.5">
                <i class="fas fa-location-dot text-primary" style="font-size: 1rem"></i>
              </div>
              <span class="text-body text-ink">{{ spot.address }}</span>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-5 shrink-0 flex justify-center pt-0.5">
                <i class="fas fa-clock text-primary" style="font-size: 1rem"></i>
              </div>
              <span class="text-body text-ink">{{ spot.openTime }}</span>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-5 shrink-0 flex justify-center pt-0.5">
                <i class="fas fa-phone text-primary" style="font-size: 1rem"></i>
              </div>
              <span class="text-body text-ink">{{ spot.phone }}</span>
            </div>
            <div v-if="spot.website" class="flex items-start gap-3">
              <div class="w-5 shrink-0 flex justify-center pt-0.5">
                <i class="fas fa-globe text-primary" style="font-size: 1rem"></i>
              </div>
              <a :href="spot.website" target="_blank" rel="noopener noreferrer"
                class="text-body text-primary hover:underline">
                {{ spot.website }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button v-show="showGoTop"
      class="fixed bottom-[88px] right-6 z-50 w-12 h-12 rounded-full bg-surface border border-border-soft shadow-md flex items-center justify-center"
      @click="scrollToTop">
      <i class="fas fa-chevron-up text-ink"></i>
    </button>
  </div>

  <div v-else
    class="min-h-screen bg-bg-base flex flex-col items-center justify-center text-center gap-4 px-[clamp(16px,4vw,40px)]">
    <i class="fas fa-map-location-dot text-primary" style="font-size: 4rem"></i>
    <h1 class="text-heading-sm md:text-heading-pc font-bold text-ink">找不到此景點</h1>
    <p class="text-body text-muted">很抱歉，找不到您要查看的景點資訊。</p>
    <button class="text-button font-medium bg-primary text-white rounded-full px-6 py-2" @click="goToOtherSpots">
      瀏覽其他地區
    </button>
  </div>
</template>

<style scoped>
.spot-bg {
  background: linear-gradient(135deg,
      #FFF8EF 0%,
      #F8FCF8 45%,
      #EAF7F3 100%)
}
</style>
