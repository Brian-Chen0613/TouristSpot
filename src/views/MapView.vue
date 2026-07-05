<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import * as topojson from 'topojson-client'
import topoData from '@/data/taiwan-country.topo.json'
import { cityNameToSlug } from '@/data/cityMap'
import natureImg from '@/assets/img/mapView/NaturePic.png'
import ruinImg from '@/assets/img/mapView/Ruin.png'
import specialImg from '@/assets/img/mapView/Special.png'

const router = useRouter()
const mapContainer = ref(null)
let map = null
let countyLayer = null
let resizeObserver = null

const NOTICE_STORAGE_KEY = 'tw-travel-data-notice-seen'
const showNotice = ref(false)

const closeNotice = () => {
  showNotice.value = false
  sessionStorage.setItem(NOTICE_STORAGE_KEY, 'true')
}

const featureCards = [
  { icon: 'fa-mountain', title: '山海之美', desc: '壯麗山景與迷人海岸，感受大自然的鬼斧神工', image: natureImg },
  { icon: 'fa-landmark', title: '文化古蹟', desc: '走訪歷史遺跡與古老街區，體驗在地文化底蘊', image: ruinImg },
  { icon: 'fa-camera', title: '特色體驗', desc: '品嚐在地美食、參與節慶活動，創造獨特的旅行回憶', image: specialImg },
]

const desktopBreakpoint = window.matchMedia('(min-width: 1000px)')
const getMinZoom = () => (desktopBreakpoint.matches ? 8 : 7.4)

const recenterMap = () => {
  map.setMinZoom(getMinZoom())
  map.invalidateSize()
  map.fitBounds(countyLayer.getBounds(), { padding: [16, 16] })
}

// 臺北/基隆/新北、嘉義市/嘉義縣彼此區塊小、位置緊鄰，重心標籤會重疊，
// 這幾個縣市改用縮小字體 + 手動位移的 class 錯開文字
const LABEL_OVERRIDE_CLASS = {
  '臺北市': 'county-label--taipei',
  '基隆市': 'county-label--keelung',
  '新北市': 'county-label--new-taipei',
  '臺中市': 'county-label--taichung',
  '嘉義市': 'county-label--chiayi-city',
  '嘉義縣': 'county-label--chiayi-county',
}

const OUTLYING_ISLAND_COUNTY = '澎湖縣'

const ringArea = (ring) => {
  let sum = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum / 2)
}

const ringCentroid = (ring) => {
  let area = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    const cross = x1 * y2 - x2 * y1
    area += cross
    cx += (x1 + x2) * cross
    cy += (y1 + y2) * cross
  }
  area /= 2
  return [cy / (6 * area), cx / (6 * area)] // [lat, lng]
}

// 縣市 Polygon 用幾何重心定位名稱標籤（比 bounds 中心更貼合凹陷形狀），
// 澎湖縣仍是離散小島構成的 MultiPolygon，退回用 bounds 中心即可
const getLabelLatLng = (feature, layer) => {
  if (feature.geometry.type === 'Polygon') {
    const [lat, lng] = ringCentroid(feature.geometry.coordinates[0])
    return [lat, lng]
  }
  return layer.getBounds().getCenter()
}

// 除了澎湖縣（本身即為離島縣市）外，只保留每個縣市面積最大的那塊陸地，
// 過濾掉龜山島、釣魚台、綠島、蘭嶼、小琉球等零星離島，避免 fitBounds 因這些
// 遠離本島的小島而把地圖視野拉歪
const keepMainlandOnly = (featureCollection) => {
  featureCollection.features.forEach((feature) => {
    const { geometry, properties } = feature
    if (geometry.type !== 'MultiPolygon' || properties.name === OUTLYING_ISLAND_COUNTY) return

    let mainland = geometry.coordinates[0]
    let mainlandArea = ringArea(mainland[0])
    for (const polygon of geometry.coordinates) {
      const area = ringArea(polygon[0])
      if (area > mainlandArea) {
        mainland = polygon
        mainlandArea = area
      }
    }
    geometry.type = 'Polygon'
    geometry.coordinates = mainland
  })
  return featureCollection
}

onMounted(() => {
  if (!sessionStorage.getItem(NOTICE_STORAGE_KEY)) {
    showNotice.value = true
  }

  map = L.map(mapContainer.value, {
    minZoom: getMinZoom(),
    scrollWheelZoom: false,
    touchZoom: false,
    doubleClickZoom: false,
    dragging: false,
    keyboard: false,
    boxZoom: false,
    zoomControl: false,
  })

  const geoJson = keepMainlandOnly(topojson.feature(topoData, topoData.objects.map))
  const labelLayer = L.layerGroup()

  countyLayer = L.geoJSON(geoJson, {
    filter: (feature) => Boolean(cityNameToSlug[feature.properties.name]),
    style: () => ({
      fillColor: '#A8C5A0',
      fillOpacity: 1,
      color: '#3A7D44',
      weight: 1,
    }),
    onEachFeature: (feature, layer) => {
      const cityName = feature.properties.name

      layer.bindTooltip(cityName, { direction: 'top', sticky: true })

      layer.on({
        mouseover: () => {
          layer.setStyle({ fillColor: '#3A7D44', weight: 2 })
        },
        mouseout: () => {
          layer.setStyle({ fillColor: '#A8C5A0', weight: 1 })
        },
        click: () => {
          const citySlug = cityNameToSlug[cityName]
          router.push('/map/' + citySlug)
        },
      })

      const overrideClass = LABEL_OVERRIDE_CLASS[cityName] ?? ''

      L.marker(getLabelLatLng(feature, layer), {
        icon: L.divIcon({
          className: 'county-label',
          html: `<span class="${overrideClass}">${cityName}</span>`,
          iconSize: [0, 0],
        }),
        interactive: false,
      }).addTo(labelLayer)
    },
  }).addTo(map)

  labelLayer.addTo(map)

  recenterMap()

  resizeObserver = new ResizeObserver(() => recenterMap())
  resizeObserver.observe(mapContainer.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
})
</script>

<template>
  <div
    class="min-h-screen min-[1000px]:h-screen bg-bg-base grid grid-cols-1 min-[1000px]:grid-cols-[auto_auto] min-[1000px]:grid-rows-[auto_1fr] gap-[clamp(24px,3vw,48px)] justify-center p-6 [grid-template-areas:'header'_'map'_'cards'] min-[1000px]:[grid-template-areas:'header_map'_'cards_map']">
    <header
      class="[grid-area:header] flex flex-col gap-1 items-center text-center min-[1000px]:items-start min-[1000px]:text-left min-[1000px]:pt-[clamp(2vh,2vw,11vh)]">
      <h2 class="text-heading-sm min-[1000px]:text-heading-pc font-bold text-ink">選擇縣市，開始探索</h2>
      <p class="text-subheading-sm min-[1000px]:text-subheading-pc text-muted">點擊地圖上的縣市以查看景點</p>
    </header>
    <div
      class="[grid-area:cards] flex flex-col gap-[clamp(16px,5vw,24px)] min-[1000px]:pr-0 bg-bg-base">
      <div v-for="card in featureCards" :key="card.title"
        class="bg-surface rounded-xl border border-border-soft p-3 flex items-center gap-4 min-[1000px]:max-w-[600px]">
        <div class="w-[120px] h-[120px] shrink-0 rounded-lg overflow-hidden">
          <img :src="card.image" :alt="card.title" class="w-full h-full object-cover" />
        </div>
        <div class="min-w-0 flex flex-col gap-2">
          <span class="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 ">
            <i :class="['fas', card.icon, 'text-white',]" style="font-size: 1.5rem"></i>
          </span>
          <h3 class="text-subheading-sm font-medium text-ink ">{{ card.title }}</h3>
          <p class="text-body text-muted">{{ card.desc }}</p>
        </div>
      </div>
    </div>
    <div class="[grid-area:map] min-[1000px]:justify-self-center">
      <div class="h-[60vh] min-[1000px]:h-full min-[1000px]:aspect-[13/20]">
        <div id="map" ref="mapContainer" class="w-full h-full"></div>
      </div>
    </div>

    <div v-if="showNotice" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6">
      <div class="bg-surface rounded-2xl p-6 w-full max-w-[360px] flex flex-col gap-4">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <i class="fas fa-circle-info text-primary" style="font-size: 1.5rem"></i>
        </div>
        <h3 class="text-subheading-sm font-medium text-ink">資料建置中</h3>
        <p class="text-body text-muted">目前僅完整收錄「臺中市」的景點資料，其餘縣市仍在陸續建置中，敬請期待！</p>
        <button
          class="w-full py-2 rounded-full bg-primary text-white text-button font-medium hover:opacity-90 transition-opacity duration-200"
          @click="closeNotice">
          我知道了
        </button>
      </div>
    </div>
  </div>
</template>

<style>
#map {
  height: 100%;
  background-color: #F5F0DC;
  position: relative;
  z-index: 0;
}

.leaflet-tooltip {
  background: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #2C2C2C;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  padding: 4px 8px;
}

.leaflet-tooltip-top::before {
  border-top-color: #FFFFFF;
}

.county-label {
  pointer-events: none;
}

.county-label span {
  display: inline-block;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 500;
  color: #FFFFFF;
  text-shadow: 0 0 3px rgba(44, 44, 44, 0.9), 0 0 3px rgba(44, 44, 44, 0.9);
}

.county-label span.county-label--taipei {
  transform: translate(calc(-50% - 4px), calc(-50% + 0px));
}

.county-label span.county-label--keelung {
  transform: translate(calc(-50% + 20px), calc(-50% - 10px));
}

.county-label span.county-label--new-taipei {
  transform: translate(calc(-50% - 5px), calc(-50% + 20px));
}

.county-label span.county-label--taichung {
  transform: translate(calc(-50% - 5px), calc(-50% + 8px));
}

.county-label span.county-label--chiayi-city {
  transform: translate(calc(-50% - 4px), calc(-50% - 0px));
}

.county-label span.county-label--chiayi-county {
  transform: translate(calc(-50% + 25px), calc(-50% + 10px));
}
</style>
