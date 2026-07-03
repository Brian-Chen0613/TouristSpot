<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { spots } from '@/data/spotData.js'
import { useFavorites } from '@/composables/useFavorites.js'
import { useCityViewState } from '@/composables/useCityViewState.js'

const route = useRoute()
const router = useRouter()
const { isFavorite, toggleFavorite } = useFavorites()
const { saveState, getState } = useCityViewState()

const savedState = getState(route.params.city)

const activeFilter = ref(savedState?.filter ?? '全部')
const filters = ['全部', '自然風景', '人文藝術', '美食', '古蹟']

const citySpots = computed(() =>
  spots.filter((spot) => spot.city === route.params.city)
)

const cityName = computed(() => citySpots.value[0]?.cityName ?? '')

const filteredSpots = computed(() =>
  activeFilter.value === '全部'
    ? citySpots.value
    : citySpots.value.filter((spot) => spot.category === activeFilter.value)
)

watch(activeFilter, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

const showGoTop = ref(false)
const handleScroll = () => {
  showGoTop.value = window.scrollY > 300
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  if (savedState?.scrollY) {
    nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedState.scrollY })
        })
      })
    })
  }
})
onBeforeUnmount(() => {
  saveState(route.params.city, activeFilter.value, window.scrollY)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const goToSpot = (spotId) => {
  router.push('/map/' + route.params.city + '/' + spotId)
}
</script>

<template>
  <div v-if="citySpots.length" class="min-h-screen w-full city-bg">
    <header class="city-header flex flex-col px-[clamp(16px,4vw,40px)] pt-[clamp(16px,3vw,24px)] pb-[clamp(12px,2vw,16px)]">
      <div class="max-w-[1300px] mx-auto w-full flex flex-col gap-[clamp(12px,1.5vw,16px)]">
        <h1 class="text-heading-sm md:text-heading-pc font-bold text-ink">
          歡迎來到 <span class="text-secondary">{{ cityName }}</span>
        </h1>
        <button
          class="text-button font-medium text-primary flex items-center gap-2 self-start"
          @click="router.push('/map')"
        >
          <i class="fas fa-arrow-left"></i>
          返回地圖
        </button>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter"
            class="text-label rounded-full px-4 py-1 transition-colors duration-200"
            :class="activeFilter === filter
              ? 'bg-primary text-white border-transparent'
              : 'bg-surface text-ink border border-border-soft'"
            @click="activeFilter = filter"
          >
            {{ filter }}
          </button>
        </div>
      </div>
    </header>

    <div class="max-w-[1300px] mx-auto w-full flex flex-col gap-[clamp(12px,2vw,16px)] px-[clamp(16px,4vw,40px)] py-[clamp(16px,3vw,24px)]">
      <div
        v-for="spot in filteredSpots"
        :key="spot.id"
        class="bg-surface rounded-xl border border-border-soft overflow-hidden flex flex-col min-[500px]:flex-row gap-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
        @click="goToSpot(spot.id)"
      >
        <div class="w-full min-[500px]:w-[150px] md:w-[200px] shrink-0">
          <img
            v-if="spot.images[0]"
            :src="spot.images[0]"
            :alt="spot.name"
            class="aspect-[4/3] min-[500px]:aspect-square md:aspect-[4/3] w-full object-cover"
          />
          <div v-else class="bg-border-soft flex items-center justify-center aspect-[4/3] min-[500px]:aspect-square md:aspect-[4/3]">
            <i class="fas fa-image text-muted"></i>
          </div>
        </div>
        <div class="min-w-0 flex-1 p-3 pt-0 min-[500px]:pt-3 flex flex-col justify-between gap-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-subheading-sm font-medium text-ink truncate">{{ spot.name }}</span>
            <button
              class="shrink-0"
              :class="isFavorite(spot.id) ? 'text-danger' : 'text-muted'"
              @click.stop="toggleFavorite(spot.id)"
            >
              <i class="fas fa-heart" style="font-size: 1.5rem"></i>
            </button>
          </div>
          <span class="self-start px-2 py-0.5 rounded-full bg-primary/10 text-label text-primary">
            {{ spot.category }}
          </span>
          <p class="text-body text-muted line-clamp-2">{{ spot.description }}</p>
        </div>
      </div>
    </div>

    <button
      v-show="showGoTop"
      class="fixed bottom-[88px] right-6 w-12 h-12 rounded-full bg-surface border border-border-soft shadow-md flex items-center justify-center"
      @click="scrollToTop"
    >
      <i class="fas fa-chevron-up text-ink"></i>
    </button>
  </div>

  <div v-else class="min-h-screen bg-bg-base flex flex-col items-center justify-center text-center gap-4 px-[clamp(16px,4vw,40px)]">
    <i class="fas fa-map-location-dot text-primary" style="font-size: 4rem"></i>
    <h1 class="text-heading-sm md:text-heading-pc font-bold text-ink">找不到此縣市</h1>
    <p class="text-body text-muted">很抱歉，找不到您要瀏覽的縣市，請返回地圖重新選擇。</p>
    <button
      class="text-button font-medium bg-primary text-white rounded-full px-6 py-2"
      @click="router.push('/map')"
    >
      返回地圖
    </button>
  </div>
</template>

<style>
.city-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #F5F0DC;
}

.city-bg {
  background: linear-gradient(135deg,
      #FFF8EF 0%,
      #F8FCF8 45%,
      #EAF7F3 100%)
}
</style>
