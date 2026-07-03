<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFavorites } from '@/composables/useFavorites.js'
import { spots } from '@/data/spotData.js'

const router = useRouter()
const { favorites, toggleFavorite, clearAll } = useFavorites()

const isOpen = ref(false)
const showConfirm = ref(false)

const favoriteSpots = computed(() =>
  favorites.value.map((id) => spots.find((s) => s.id === id)).filter(Boolean)
)

const goToSpot = (spot) => {
  isOpen.value = false
  router.push('/map/' + spot.city + '/' + spot.id)
}
</script>

<template>
  <button
    class="fixed z-50 w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center"
    style="bottom: 24px; right: 24px"
    @click="isOpen = true"
  >
    <i class="fas fa-heart" style="font-size: 1.5rem"></i>
    <span
      v-show="favorites.length > 0"
      class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center"
      style="font-size: 0.75rem"
    >
      {{ favorites.length }}
    </span>
  </button>

  <div
    v-if="isOpen"
    class="hidden md:block fixed inset-0 bg-black/40 z-[49]"
    @click="isOpen = false"
  ></div>

  <Transition name="drawer">
    <div
      v-if="isOpen"
      class="fixed top-0 right-0 h-screen z-50 w-full md:w-[360px] bg-surface shadow-xl flex flex-col"
    >
      <div class="flex items-center justify-between px-6 py-4 border-b border-border-soft shrink-0">
        <h2 class="text-subheading-sm font-medium text-ink">我的收藏</h2>
        <button
          class="text-muted hover:text-ink transition-colors duration-200"
          @click="isOpen = false"
        >
          <i class="fas fa-xmark" style="font-size: 1.25rem"></i>
        </button>
      </div>

      <div
        v-if="favoriteSpots.length"
        class="flex-1 overflow-y-auto flex flex-col gap-[clamp(8px,1.5vw,12px)] p-[clamp(12px,3vw,16px)]"
      >
        <div
          v-for="spot in favoriteSpots"
          :key="spot.id"
          class="flex items-center gap-3 p-2 rounded-xl border border-border-soft bg-bg-base cursor-pointer hover:shadow-sm transition-shadow duration-200"
          @click="goToSpot(spot)"
        >
          <div class="w-[60px] h-[60px] rounded-lg overflow-hidden shrink-0">
            <img v-if="spot.images[0]" :src="spot.images[0]" :alt="spot.name" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-border-soft flex items-center justify-center">
              <i class="fas fa-image text-muted" style="font-size: 0.875rem"></i>
            </div>
          </div>
          <div class="min-w-0 flex-1 flex flex-col gap-0.5">
            <span class="text-body font-medium text-ink truncate">{{ spot.name }}</span>
            <span class="text-label text-muted">{{ spot.cityName }}</span>
          </div>
          <button
            class="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-danger/10 text-muted hover:text-danger transition-colors duration-200"
            @click.stop="toggleFavorite(spot.id)"
          >
            <i class="fas fa-xmark" style="font-size: 1rem"></i>
          </button>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col items-center justify-center gap-3 text-muted">
        <i class="fas fa-heart-crack" style="font-size: 2.5rem"></i>
        <p class="text-body">還沒有收藏任何景點</p>
      </div>

      <div
        v-show="favorites.length > 0"
        class="shrink-0 px-[clamp(12px,3vw,16px)] py-4 border-t border-border-soft"
      >
        <button
          class="w-full py-2 rounded-full border border-danger text-danger text-button font-medium hover:bg-danger/10 transition-colors duration-200"
          @click="showConfirm = true"
        >
          清空所有收藏
        </button>
      </div>
    </div>
  </Transition>

  <div
    v-if="showConfirm"
    class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6"
  >
    <div class="bg-surface rounded-2xl p-6 w-full max-w-[320px] flex flex-col gap-4">
      <h3 class="text-subheading-sm font-medium text-ink">確定要清空所有收藏嗎？</h3>
      <p class="text-body text-muted">此操作無法復原，所有收藏的景點將被移除。</p>
      <div class="flex gap-3">
        <button
          class="flex-1 py-2 rounded-full border border-border-soft text-ink text-button font-medium hover:bg-bg-base transition-colors duration-200"
          @click="showConfirm = false"
        >
          取消
        </button>
        <button
          class="flex-1 py-2 rounded-full bg-danger text-white text-button font-medium hover:opacity-90 transition-opacity duration-200"
          @click="clearAll(); showConfirm = false"
        >
          確定清空
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
.drawer-enter-to,
.drawer-leave-from {
  transform: translateX(0);
}
</style>
