import { ref } from 'vue'

const STORAGE_KEY = 'tw-travel-favorites'

// 讀取
const loadFavorites = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const favorites = ref(loadFavorites())

// 寫入
const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
}

export function useFavorites() {
  const toggleFavorite = (id) => {
    const index = favorites.value.indexOf(id)
    if (index === -1) {
      favorites.value.push(id)
    } else {
      favorites.value.splice(index, 1)
    }
    persist()
  }

  const isFavorite = (id) => favorites.value.includes(id)

  const clearAll = () => {
    favorites.value = []
    persist()
  }

  return { favorites, toggleFavorite, isFavorite, clearAll }
}
