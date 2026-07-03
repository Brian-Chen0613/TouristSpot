# 臺灣旅遊網站 — Claude Code 專案指引

## 專案定位

個人作品集（Portfolio）展示用的臺灣旅遊景點介紹網站。
重點在於展示前端架構能力與視覺設計，不串接後端或外部 API。

---

## 技術棧

| 項目 | 選擇 |
|---|---|
| 框架 | Vue 3 + Vite |
| 路由 | Vue Router 4 |
| 元件語法 | `<script setup>`（強制，禁止使用 Options API） |
| 樣式 | Tailwind CSS v3（utility-first，禁止引入 Bootstrap、Ant Design Vue） |
| 圖示 | FontAwesome（CDN 或 npm 套件） |
| 地圖 | Leaflet.js + topojson-client |
| 地圖資料 | `src/data/taiwan-country.topo.json`（MIT 授權） |
| 狀態管理 | 無（不使用 Pinia） |
| 本地儲存 | localStorage（收藏功能專用） |
| Lottie 播放器 | `@lottiefiles/dotlottie-vue`（Vue 3 原生套件，npm 安裝） |

---

## 字體規範

全站統一使用 **Noto Sans TC**，透過字重製造視覺層次。

### 引入方式（於 `index.html`）

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
```

### 全站字體層級

字體大小統一定義於 `tailwind.config.js` 的 `theme.extend.fontSize`，在 template 中以 token class 使用（例如 `text-heading-sm`、`text-body`）。禁止在 template 直接使用 Tailwind 內建尺寸 class（如 `text-2xl`、`text-lg`）定義字體大小，一律改用以下 token。

| Token | 用途 | 字重 | 大小 | RWD 寫法 |
|---|---|---|---|---|
| `text-heading-sm` | 頁面主標題，手機版 | 700 | 2.25rem | 預設 |
| `text-heading-pc` | 頁面主標題，桌機版 | 700 | 3rem | `md:text-heading-pc` |
| `text-subheading-sm` | 區塊標題、卡片標題、sidebar 選項，手機版 | 500 | 1.25rem | 預設 |
| `text-subheading-pc` | 區塊標題、卡片標題、sidebar 選項，桌機版 | 500 | 1.5rem | `md:text-subheading-pc` |
| `text-body` | 景點描述、段落文字、地址、開放時間 | 400 | 1rem | 固定，不縮放 |
| `text-button` | 所有互動按鈕文字 | 500 | 1rem | 固定，不縮放 |
| `text-label` | 膠囊 badge、輔助 label | 400 | 0.875rem | 固定，不縮放 |

**template 使用範例**

```html
<h1 class="text-heading-sm md:text-heading-pc font-bold">探索台灣旅遊景點</h1>
<h2 class="text-subheading-sm md:text-subheading-pc font-medium">彩虹眷村</h2>
<p class="text-body">景點描述文字</p>
<button class="text-button font-medium">開始探索</button>
<span class="text-label">人文藝術</span>
```

### 規則
- 內文段落與互動按鈕最小 1rem，禁止低於此限
- `text-label`（0.875rem）僅限 badge 與輔助 label 使用，不可用於內文
- 禁止使用 `clamp()` 處理字體大小，一律使用 Tailwind 斷點（clamp() 僅允許用於區塊間距）
- 禁止在 template 直接寫 `text-2xl`、`text-lg` 等內建尺寸 class，一律使用上方 token

---

## 頁面架構與路由

```
/                  → HomeView.vue        首頁
/map               → MapView.vue         互動地圖（選縣市）
/map/:city         → CityView.vue        城市景點列表
/map/:city/:spotId → SpotView.vue        單一景點詳情
/404               → NotFoundView.vue    404 錯誤頁
```

所有路由為**平行路由**，在 `App.vue` 使用單一 `<RouterView />`，全頁切換。
禁止使用巢狀路由（nested routes）。

### 404 路由規範

`/404` 為獨立路由，對應 `NotFoundView.vue`。在路由表**最後**新增萬用路由（catch-all），將所有未定義的路徑導向 `/404`：

```js
// router/index.js（路由表最後一條）
{ path: '/:pathMatch(.*)*', redirect: '/404' }
```

流程：

```
使用者打入未定義的路徑（例如 /about）
  ↓
Vue Router 比對所有路由規則，皆不符合
  ↓
觸發萬用路由，redirect 至 /404
  ↓
網址列顯示 /404，載入 NotFoundView.vue
```

畫面內容詳見下方「NotFoundView 規範」段落。視覺風格與 CityView／SpotView 的「找不到資料」提示畫面共用同一套設計語言。

**與「找不到資料」的差異（務必區分，不可混用）**

| 情境 | 觸發層級 | 範例 | 處理方式 |
|---|---|---|---|
| 404 | 路由規則完全不匹配 | `/about` | 導向獨立路由 `/404` |
| 找不到資料 | 路由匹配成功，但業務資料查無結果 | `/map/不存在的城市` | 在原 View 內以 `v-if` 顯示提示畫面，不導頁 |

---

## 導航流程

```
HomeView
  ↓ 點擊「開始探索」按鈕
MapView（Leaflet 地圖，點擊縣市色塊）
  ↓ 點擊縣市
CityView（景點卡片列表）
  ↓ 點擊景點卡片
SpotView（景點詳情）
```

### 返回按鈕規則
- CityView：1 個返回按鈕 → 回 MapView（`/map`）
- SpotView：2 個返回按鈕
  - 返回城市列表 → 回 CityView（`/map/:city`）
  - 返回地圖 → 回 MapView（`/map`）

---

## 資料架構

所有景點資料存放於 `src/data/spotData.js`，為**單一資料來源（Single Source of Truth）**。

### 資料結構規範

```js
// src/data/spotData.js
export const spots = [
  {
    id: 'taichung-001',          // 字串，格式為 {city}-{序號}
    city: 'taichung',            // 對應路由 :city 參數
    cityName: '臺中市',
    name: '彩虹眷村',
    description: '...',          // 景點描述文字
    address: '臺中市南屯區...',
    openTime: '全日開放',
    phone: '04-XXXX-XXXX',
    website: 'https://...',      // 官網連結，選填，無官網填 null
    category: '人文藝術',        // 自然風景 / 人文藝術 / 美食 / 古蹟
    images: ['/images/spots/taichung-001.jpg'],  // 圖片陣列，取 [0] 作為主圖
  },
  // ...
]
```

**`image` 欄位已於 SpotView 實作時改為 `images` 陣列**。`CityView.vue` 與 `FavoritesDrawer.vue` 的圖片來源一律改用 `spot.images[0]`。

### 資料操作規則
- 元件**禁止**直接寫死資料，一律從 `spotData.js` 引入
- 用 `computed` 或函式依 `city` 參數過濾資料，不另建資料檔
- 新增城市只需在 `spotData.js` 新增資料，不需修改元件

### 找不到資料時的處理（非 404）

注意：以下情境是路由**匹配成功**，但查無對應資料，與 Vue Router 的 404（路徑完全未定義）是不同層級的問題，不使用 `router.push` 導向錯誤頁面，而是在當前 View 內顯示提示畫面。

**CityView：`:city` 不存在於 `cityNameToSlug` 對照表內**

```
CityView 載入
  ↓
依 route.params.city 篩選 spotData.js
  ↓
篩選結果為空陣列
  ↓
顯示「找不到此縣市」提示畫面，按鈕導向 /map
```

畫面內容：
- 插圖（地圖／搜尋主題，風格與整體配色一致）
- 標題：「找不到此縣市」
- 說明文字：「很抱歉，找不到您要瀏覽的縣市，請返回地圖重新選擇。」
- 按鈕：「返回地圖」→ `router.push('/map')`

**SpotView：`:spotId` 不存在於 `spotData.js` 內**

```
SpotView 載入
  ↓
依 route.params.spotId 在 spotData.js 中尋找對應物件
  ↓
找不到符合的 spot
  ↓
顯示「找不到此景點」提示畫面，按鈕導向 /map/:city
  ↓
若 :city 本身也無效，按鈕改為導向 /map
```

畫面內容：
- 插圖（同上風格）
- 標題：「找不到此景點」
- 說明文字：「很抱歉，找不到您要查看的景點資訊。」
- 按鈕：「瀏覽其他地區」→ 優先 `router.push('/map/' + route.params.city)`，若該 city 無效則 `router.push('/map')`

兩種情境皆**不額外建立路由**，直接在 CityView.vue / SpotView.vue 內以條件渲染（`v-if`）切換正常內容與提示畫面。

---

## 地圖（MapView）規範

### 斷點覆寫（重要）

這個頁面**不使用**全站預設的 `md:`（768px）斷點，改用 Tailwind 任意值 `min-[1000px]:`，只把 MapView 這一頁的手機／桌機切版時機獨立調整為 1000px，不影響 CityView、HomeView 等其他頁面的 `md:` 斷點。以下規範內所有「桌機／手機」都是以 `min-[1000px]:` 為分界，不是 `md:`。

### 版面結構

用 CSS Grid 搭配具名區域（`grid-template-areas`）實作。header、cards、map 三個元素在 template 裡的 DOM 順序固定（header → cards → map），靠手機／桌機套用不同的 `grid-template-areas` 讓視覺順序不同，不需要為了排序不同而複製 DOM 或用 `order`。

**桌機版（≥1000px）**

```
┌──────────────┬──────────────┐
│  標題區       │              │
├──────────────┤   Leaflet    │
│  卡片 1      │     地圖      │  ← map 區域橫跨兩列，
│  卡片 2      │（aspect-[13/20]，依高度定寬）│   自動撐滿「標題+卡片」的總高度
│  卡片 3      │              │
└──────────────┴──────────────┘
```

**手機版（<1000px）**

```
┌──────────────────┐  ← min-h-screen（允許捲動）
│  標題區           │
├──────────────────┤
│  Leaflet 地圖     │  ← h-[60vh]（固定高度）
├──────────────────┤
│  卡片 1          │
│  卡片 2          │  ← 正常文件流
│  卡片 3          │
└──────────────────┘
```

**根容器 class 規則**

```
min-h-screen min-[1000px]:h-screen bg-bg-base grid grid-cols-1
min-[1000px]:grid-cols-[auto_auto] min-[1000px]:grid-rows-[auto_1fr]
gap-[clamp(24px,3vw,48px)] justify-center p-6
[grid-template-areas:'header'_'map'_'cards']
min-[1000px]:[grid-template-areas:'header_map'_'cards_map']
```

- 手機版 `grid-template-areas` 是單欄三列：`header` / `map` / `cards`，對應視覺順序「標題→地圖→卡片」
- 桌機版是兩欄兩列：第一列 `header map`、第二列 `cards map`。`map` 這個區域名稱在兩列都出現，Grid 會自動把它合併撐滿兩列的總高度，地圖因此天生佔滿「標題＋卡片」疊起來的整欄高度，不需要額外計算高度，也不需要 `flex-1`
- 兩欄欄寬皆為 `auto`（依內容自然寬度撐開），配合根容器的 `justify-center`，讓「左欄（標題+卡片）＋右欄（地圖）」整組在畫面水平置中，不用寫死欄寬
- header、cards、map 三個子元素分別用 `[grid-area:header]`、`[grid-area:cards]`、`[grid-area:map]` 對應到上面的區域名稱；地圖外層額外加 `min-[1000px]:justify-self-center`，讓依高度算出的地圖寬度在欄位內置中

**不需要 `min-h-0` / `overflow-y-auto`**：沒有任何元素用 `flex-1` 去撐滿剩餘空間（地圖撐滿高度是靠 Grid 區域合併，卡片欄本身只依內容自然高度），不會發生「卡片內容比可用空間高、被撐爆」的情況，因此不需要額外的 overflow 控制或 min-height 修正。

### 標題區

- 不設定獨立背景與邊框，融入頁面底色 `bg-bg-base`
- 標題：`text-heading-sm min-[1000px]:text-heading-pc font-bold text-ink`，文字「選擇縣市，開始探索」
- 說明文字：`text-subheading-sm min-[1000px]:text-subheading-pc text-muted`，文字「點擊地圖上的縣市以查看景點」
- 內距：手機版沒有獨立的 `pt`，靠根容器的 `p-6` 提供四周間距；桌機版額外加 `min-[1000px]:pt-[11vh]`，讓標題往下推、跟旁邊撐滿整欄高度的地圖視覺上更平衡。標題與說明之間 `gap-1`
- 文字對齊：手機版置中（`items-center text-center`），桌機版靠左（`min-[1000px]:items-start min-[1000px]:text-left`）

### Leaflet 地圖設定

- 使用 Leaflet.js 繪製臺灣縣市色塊（GeoJSON 模式，無 OpenStreetMap 底圖）
- 地圖資料：`src/data/taiwan-country.topo.json`，需用 `topojson-client` 轉換為 GeoJSON
- 地圖容器：`w-full h-full`，需在 `<style>` 補充 `#map { height: 100%; }` 確保 Leaflet 能讀到明確高度
- 初始視野：不寫死 center / zoom，改用 `map.fitBounds(countyLayer.getBounds(), { padding: [16, 16] })`，在縣市 GeoJSON 圖層加入地圖後動態置中並完整顯示臺灣本島＋離島
- RWD 重新置中：用 `ResizeObserver` 監聽地圖容器（`mapContainer`），容器尺寸改變時（視窗縮放、RWD 斷點切換等）呼叫 `map.invalidateSize()` 並重新 `fitBounds()`，確保地圖持續置中；於 `onUnmounted` 呼叫 `resizeObserver.disconnect()` 清除
- 縮放下限：採用 JS 動態值，不是寫死的常數：
  ```js
  const desktopBreakpoint = window.matchMedia('(min-width: 1000px)')
  const getMinZoom = () => (desktopBreakpoint.matches ? 8 : 7.4)
  ```
  在地圖初始化與每次 `recenterMap()`（也就是每次 `resizeObserver` 觸發時）都呼叫 `map.setMinZoom(getMinZoom())`，讓縮放下限跟著跟版面同一個 1000px 斷點切換：桌機版用 `8`、手機版用 `7.4`。原因：手機螢幕寬度窄，`fitBounds()` 算出的理想縮放層級通常比桌機低；如果沿用桌機的 `minZoom: 8`，手機版會被強制放大超過理想值，導致臺灣本島邊緣被容器裁掉。分開設定兩個斷點各自的下限，才能兩邊都維持「剛好完整顯示、不裁切」的效果
- 停用所有地圖互動：滾輪縮放（`scrollWheelZoom: false`）、觸控縮放（`touchZoom: false`）、雙擊縮放（`doubleClickZoom: false`）、拖動（`dragging: false`）、鍵盤控制（`keyboard: false`）、方塊縮放（`boxZoom: false`）、縮放 +/- 按鈕（`zoomControl: false`）
- 地圖僅用於展示縣市色塊與點擊導頁，不提供使用者平移或縮放
- 地圖背景色：`#F5F0DC`（與頁面 `bg-base` 同色），必須在 `<style>` 用 `#map { background-color: #F5F0DC }` 設定，不能只掛 Tailwind class。原因：Leaflet 初始化時會自動幫容器加上 `.leaflet-container` class，而 `leaflet.css` 對這個 class 設有預設背景 `background: #ddd`；`.leaflet-container` 與 Tailwind 的 `.bg-bg-base` 同為 class selector，特異度相同，實際套用結果取決於兩個樣式表在 build 後的載入順序，Tailwind class 不保證能蓋過 Leaflet 的預設值。用 `#map` 這個 ID selector 的原生 CSS，特異度高於 class selector，才能穩定蓋過 Leaflet 的預設背景
- 無底圖 tile layer

### 縣市色塊樣式

- 預設填色：`#A8C5A0`（中度草綠）、邊框 color `#3A7D44`（primary）、邊框 weight `1`
- Hover 填色：`#3A7D44`（primary）、邊框 weight `2`
- 游標：透過 Leaflet layer 的 style 設定 `cursor: 'pointer'`

### Tooltip

- 使用 Leaflet 的 `.bindTooltip()`
- 內容：`feature.properties.name`（縣市中文名稱，例如「臺中市」）
- 選項：`{ direction: 'top', sticky: true }`（sticky 讓 tooltip 跟隨滑鼠位置移動）
- 樣式：在 `<style>` 覆寫 Leaflet 預設，白色背景、字體大小 `0.875rem`、字色 `#2C2C2C`、圓角 `6px`、細陰影

### 縣市名稱永久標籤

除了 hover 時才出現的 Tooltip，地圖上每個縣市色塊中心也要永久顯示縣市名稱文字（兩者並存，不互相取代）。

- 用 `L.marker()` + `L.divIcon()` 實作，`interactive: false` 且 CSS `pointer-events: none`，確保不擋住底下色塊的 hover／click
- 定位：縣市為單一 `Polygon` 時，用幾何重心（shoelace centroid 公式，比 `getBounds().getCenter()` 更貼合凹陷形狀）；澎湖縣仍是離散小島構成的 `MultiPolygon`，退回用 `getBounds().getCenter()`
- 所有 marker 加入獨立的 `L.layerGroup()`（`labelLayer`），統一 `addTo(map)`
- 樣式（`.county-label span`）：白色文字 + 深色 `text-shadow` 描邊（確保在淺綠與 hover 深綠底色上都清晰可讀）、字體大小 `0.875rem`、`font-weight: 500`、`white-space: nowrap`，用 `transform: translate(-50%, -50%)` 讓文字置中於座標點
- **密集區域例外**：臺北市／基隆市／新北市、臺中市、嘉義市／嘉義縣這幾個縣市面積小且位置緊鄰，重心標籤預設會重疊或位置不理想。這幾個縣市額外套用 `county-label--{slug}` class（例如 `county-label--taipei`），字體大小與其他縣市相同（`0.875rem`），只用 `transform: translate(calc(-50% + Npx), calc(-50% + Npx))` 手動微調位移，錯開文字；其餘縣市維持預設重心定位不變

### 外島排除邏輯

金門縣、連江縣**不加入** `cityNameToSlug`。繪製地圖時對每個 GeoJSON feature 做判斷：

```
cityNameToSlug[feature.properties.name] 存在？
  ↓ 是 → 繪製色塊，綁定 hover、click、tooltip 事件
  ↓ 否 → 跳過，不繪製（金門縣、連江縣在此被過濾）
```

澎湖縣正常納入，地理位置正確顯示。

**零星離島幾何過濾**：宜蘭縣（龜山島、釣魚台）、臺東縣（綠島、蘭嶼）、屏東縣（小琉球）、雲林縣等縣市的 GeoJSON 為 `MultiPolygon`，除了本島陸地外還包含這些遠離本島的零星小島。這些小島面積極小卻拉遠地圖的地理範圍，會導致 `fitBounds()` 計算出的視野被拉歪、偏向一側。因此繪製前需在 `onMounted` 內先做幾何過濾：除了澎湖縣（本身即為離島縣市，保留完整 `MultiPolygon`）外，其餘縣市只保留面積最大的那塊陸地（本島部分），把其餘小島從 `geometry` 中移除，改成單一 `Polygon`。此過濾邏輯與 `cityNameToSlug` 的縣市層級過濾是兩個獨立步驟：前者作用於「縣市」，後者作用於「單一縣市內的多個地理區塊」。

### 右側裝飾卡片欄

三張純裝飾性卡片，不可點擊，無任何互動行為。橫向排版：左側為真實圖片，右側為 icon 徽章＋標題＋說明文字。

**資料（`<script setup>` 內的陣列常數，圖片以 `import` 引入）**

```js
import natureImg from '@/assets/img/mapView/NaturePic.png'
import ruinImg from '@/assets/img/mapView/Ruin.png'
import specialImg from '@/assets/img/mapView/Special.png'

const featureCards = [
  { icon: 'fa-mountain', title: '山海之美', desc: '壯麗山景與迷人海岸，感受大自然的鬼斧神工', image: natureImg },
  { icon: 'fa-landmark', title: '文化古蹟', desc: '走訪歷史遺跡與古老街區，體驗在地文化底蘊', image: ruinImg },
  { icon: 'fa-camera',   title: '特色體驗', desc: '品嚐在地美食、參與節慶活動，創造獨特的旅行回憶', image: specialImg },
]
```

圖片素材固定放在 `src/assets/img/mapView/`，用 `import` 引入取得 build 後的正確路徑（不要放 `public/`、不要用字串路徑）。

**卡片結構（由左而右）**

```
┌────────────┬──────────────────────┐
│            │  ⛰ (綠色圓形徽章)     │
│   圖片      │  山海之美             │  ← 標題（text-subheading-sm font-medium）
│  120x120   │  壯麗山景與迷人海岸，  │  ← 說明文字（text-body text-muted）
│            │  感受大自然的鬼斧神工  │
└────────────┴──────────────────────┘
```

**樣式規範**
- 卡片外層：`bg-surface rounded-xl border border-border-soft p-3 flex items-center gap-4 min-[1000px]:max-w-[600px]`
- 圖片容器：固定 `w-[120px] h-[120px] shrink-0`（1:1 比例），`rounded-lg overflow-hidden`；內部 `<img>` 用 `w-full h-full object-cover` 裁切填滿
- 文字區：`min-w-0 flex flex-col gap-2`，不設 `flex-1`——圖片區已用 `shrink-0` 固定寬度，文字區依內容自然寬度即可，兩者維持固定間距
- icon 徽章：`w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0`，內部 `<i class="fas {icon} text-white" />` 圖示大小用原生 CSS `font-size: 1.5rem`（FontAwesome icon 尺寸不屬於文字 token 管轄範圍，允許直接設定）；徽章、標題、說明文字之間的間距統一由文字區的 `gap-2` 控制，不在個別元素上加 `mb-*`
- 標題：`text-subheading-sm font-medium text-ink`（右側欄空間有限，不做 RWD 縮放，固定使用手機版 token）
- 說明文字：`text-body text-muted`

**卡片欄容器**
- `[grid-area:cards] flex flex-col gap-[clamp(16px,5vw,24px)] min-[1000px]:pr-0 bg-bg-base`
- 手機／桌機共用同一個容器，只有桌機額外歸零右側 padding（`min-[1000px]:pr-0`），因為桌機版跟地圖之間的距離已經由根容器的 `gap-[clamp(24px,3vw,48px)]` 統一控制，不需要卡片欄自己疊加 padding
- 沒有 `justify-center`：卡片欄的垂直位置就是內容本身的自然高度，不需要在欄內置中

### 縣市名稱對照表（重要）

`taiwan-country.topo.json` 內每個縣市的 `properties.name` 為中文全稱，且用字為「臺」（如「臺中市」），不是「台」。此中文名稱**不可直接作為路由參數**，必須透過對照表轉換為英文 slug。

對照表獨立建立於 `src/data/cityMap.js`，作為**唯一轉換來源**，禁止在元件內另寫字串比對邏輯：

```js
// src/data/cityMap.js
export const cityNameToSlug = {
  '臺北市': 'taipei',
  '新北市': 'new-taipei',
  '桃園市': 'taoyuan',
  '臺中市': 'taichung',
  '臺南市': 'tainan',
  '高雄市': 'kaohsiung',
  '基隆市': 'keelung',
  '新竹市': 'hsinchu-city',
  '新竹縣': 'hsinchu-county',
  '苗栗縣': 'miaoli',
  '彰化縣': 'changhua',
  '南投縣': 'nantou',
  '雲林縣': 'yunlin',
  '嘉義市': 'chiayi-city',
  '嘉義縣': 'chiayi-county',
  '屏東縣': 'pingtung',
  '宜蘭縣': 'yilan',
  '花蓮縣': 'hualien',
  '臺東縣': 'taitung',
  '澎湖縣': 'penghu',
  // 金門縣、連江縣暫時排除
}
```

### 點擊行為

```
使用者點擊縣市色塊
  ↓
從 feature.properties.name 取得中文縣市名（例如「臺中市」）
  ↓
查詢 cityNameToSlug[name] → 取得 citySlug（例如 "taichung"）
  ↓
router.push('/map/' + citySlug)
```

`spotData.js` 內每筆資料的 `city` 欄位**必須使用此對照表中的英文 slug**，確保 CityView 的篩選邏輯（`spot.city === route.params.city`）能正確比對。

### 實作注意事項

- Leaflet 必須在 `onMounted` 後初始化，因為它需要存取真實 DOM
- 地圖實例存為 `ref`，在 `onUnmounted` 時呼叫 `.remove()` 清除，避免熱更新時重複掛載報錯
- TopoJSON 轉 GeoJSON 使用 `topojson.feature(topoData, topoData.objects.map)`，`objects` 的 key 名稱為 `map`（依 `taiwan-country.topo.json` 的實際結構）

---

## 收藏功能規範

**進度備註**：`useFavorites.js`、`FavoritesDrawer.vue` 均已實作完成，`App.vue` 已引入 `FavoritesDrawer`。

### 資料儲存
- 使用 `localStorage`，key 為 `'tw-travel-favorites'`
- 儲存格式：景點 id 的陣列，例如 `["taichung-001", "taipei-003"]`

### useFavorites.js 介面規範

封裝於 `src/composables/useFavorites.js`，export 以下四個：

```js
- favorites          → ref，值為 id 字串陣列，初始化時從 localStorage 讀取
- toggleFavorite(id) → 若 id 已存在於陣列則移除，不存在則新增，
                        操作後將 favorites 同步寫入 localStorage
- isFavorite(id)     → 回傳 Boolean，判斷 id 是否存在於 favorites 陣列
- clearAll()         → 將 favorites 清空為空陣列，並同步清除 localStorage 對應內容
```

操作流程：

```
toggleFavorite(id) 被呼叫
  ↓
判斷 id 是否已存在於 favorites
  ↙ 存在              ↘ 不存在
移除該 id            新增該 id
  ↘                  ↙
寫入 localStorage（key: 'tw-travel-favorites'）
```

### 元件架構
- 收藏邏輯封裝為 `src/composables/useFavorites.js`（Composable 模式）
- FAB + Drawer + Confirm Modal 三者封裝為單一元件 `src/components/FavoritesDrawer.vue`
- 在 `App.vue` 引入 `FavoritesDrawer`，與 `<RouterView />` 並列：

```vue
<!-- App.vue -->
<template>
  <RouterView />
  <FavoritesDrawer />
</template>
```

### UI：FAB 按鈕

- 位置：`position: fixed; bottom: 24px; right: 24px`，`z-index: 50`
- 尺寸：`w-12 h-12 rounded-full`（與 CityView 的 Go Top 按鈕相同尺寸）
- 樣式：`bg-primary text-white shadow-lg flex items-center justify-center`
- Icon：`fa-heart`，`style="font-size: 1.5rem"`（FontAwesome icon 尺寸不屬於文字 token，允許直接設定）
- 收藏數量 Badge：
  - 位置：`absolute -top-1 -right-1`
  - 樣式：`w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center`，`style="font-size: 0.75rem"`
  - 顯示條件：`v-show="favorites.length > 0"`（數量為 0 時隱藏，用 `v-show` 保留 DOM）
- 點擊：`isOpen = true`
- 所有頁面皆顯示

### UI：Drawer 面板

**RWD 行為**

| 斷點 | 行為 |
|---|---|
| 桌機版（`≥ 768px`） | 從右側滑入，寬度 `360px`，高度撐滿全螢幕，有半透明遮罩，點遮罩關閉 |
| 手機版（`< 768px`） | 全螢幕覆蓋（`w-full h-full`），頂部顯示 ✕ 關閉按鈕 |

**滑入動畫**

使用 Vue 的 `<Transition name="drawer">` 包裹 Drawer 面板，在 `<style>` 補充：

```css
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
```

`translateX(100%)` 代表「往右偏移自身寬度的 100%」，即完全移出畫面右側。進場從 `100%` 移到 `0`（歸位），離場反向。

**Drawer 面板容器**

```
fixed top-0 right-0 h-screen z-50
w-full md:w-[360px]
bg-surface shadow-xl
flex flex-col
```

**遮罩（桌機版專用）**

- class：`hidden md:block fixed inset-0 bg-black/40 z-49`（`z-49` 低於 Drawer 的 `z-50`）
- 條件：`v-if="isOpen"`
- 點擊：`isOpen = false`
- 手機版不顯示（全螢幕 Drawer 本身已覆蓋整個畫面）

**Drawer 內部結構**

```
┌────────────────────────────┐  ← flex flex-col h-screen
│ Header                      │  ← shrink-0
│ 「我的收藏」          ✕    │
├────────────────────────────┤
│ 收藏列表區                  │  ← flex-1 overflow-y-auto
│ ┌──────────────────────┐   │
│ │[縮圖] 景點名稱  城市名 [✕]│   │
│ └──────────────────────┘   │
│ ┌──────────────────────┐   │
│ │[縮圖] 景點名稱  城市名 [✕]│   │
│ └──────────────────────┘   │
│ （空狀態：無收藏時顯示提示） │
├────────────────────────────┤
│ 清空按鈕區塊（有收藏才顯示）│  ← shrink-0
└────────────────────────────┘
```

**Header**
- 容器：`flex items-center justify-between px-6 py-4 border-b border-border-soft shrink-0`
- 左側標題：`text-subheading-sm font-medium text-ink`，文字「我的收藏」
- 右側關閉按鈕：icon `fa-xmark`，`style="font-size: 1.25rem"`，`text-muted hover:text-ink transition-colors duration-200`，點擊 `isOpen = false`

**收藏列表區**
- 容器：`flex-1 overflow-y-auto flex flex-col gap-[clamp(8px,1.5vw,12px)] p-[clamp(12px,3vw,16px)]`
- `flex-1` 撐滿 Header 與清空按鈕之間的空間；`overflow-y-auto` 讓列表獨立捲動

**每筆收藏卡片**

```
┌──────────────────────────────────────┐
│ [縮圖 40×40]  景點名稱（truncate）   │
│               城市名（text-muted） [✕]│
└──────────────────────────────────────┘
```

- 卡片外層：`flex items-center gap-3 p-3 rounded-xl border border-border-soft bg-bg-base cursor-pointer hover:shadow-sm transition-shadow duration-200`
- 點擊卡片：`router.push('/map/' + spot.city + '/' + spot.id)`（`spot.city` 為 `spotData.js` 中的英文 slug）
- 縮圖容器：`w-10 h-10 rounded-lg overflow-hidden shrink-0`
  - 有圖：`<img :src="spot.images[0]" class="w-full h-full object-cover">`
  - 無圖 fallback：`bg-border-soft flex items-center justify-center` + icon `fa-image text-muted`，`style="font-size: 0.875rem"`
- 文字區：`min-w-0 flex-1 flex flex-col gap-0.5`
  - 景點名稱：`text-body font-medium text-ink truncate`
  - 城市名：`text-label text-muted`
- 刪除按鈕：`shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-danger/10 text-muted hover:text-danger transition-colors duration-200`
  - icon：`fa-xmark`，`style="font-size: 1rem"`
  - `@click.stop` 阻止冒泡（避免觸發卡片的 `router.push`）
  - 點擊：`toggleFavorite(spot.id)`

**空狀態（`favorites.length === 0` 時）**
- 以 `v-else` 取代列表渲染
- 容器：`flex-1 flex flex-col items-center justify-center gap-3 text-muted`
- Icon：`fa-heart-crack`，`style="font-size: 2.5rem"`
- 文字：`text-body`，「還沒有收藏任何景點」

**清空按鈕區塊**
- 顯示條件：`v-show="favorites.length > 0"`（`v-show` 保留 DOM，避免高度跳動）
- 容器：`shrink-0 px-[clamp(12px,3vw,16px)] py-4 border-t border-border-soft`
- 按鈕：`w-full py-2 rounded-full border border-danger text-danger text-button font-medium hover:bg-danger/10 transition-colors duration-200`
- 文字：「清空所有收藏」
- 點擊：`showConfirm = true`

### UI：Confirm Modal（清空確認）

內嵌於 `FavoritesDrawer.vue`，不抽獨立元件。條件：`v-if="showConfirm"`。

**結構**

```
┌── 遮罩（fixed inset-0 bg-black/50 z-[60]）──────────┐
│  ┌── Modal 卡片（bg-surface rounded-2xl p-6）──────┐ │
│  │  確定要清空所有收藏嗎？                          │ │
│  │  此操作無法復原，所有收藏的景點將被移除。         │ │
│  │  [ 取消 ]  [ 確定清空 ]                         │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

- 遮罩：`fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6`（`z-[60]` 高於 Drawer 的 `z-50`）
- Modal 卡片：`bg-surface rounded-2xl p-6 w-full max-w-[320px] flex flex-col gap-4`
- 標題：`text-subheading-sm font-medium text-ink`，「確定要清空所有收藏嗎？」
- 說明：`text-body text-muted`，「此操作無法復原，所有收藏的景點將被移除。」
- 按鈕列：`flex gap-3`
  - 取消：`flex-1 py-2 rounded-full border border-border-soft text-ink text-button font-medium hover:bg-bg-base transition-colors duration-200`，點擊 `showConfirm = false`
  - 確定清空：`flex-1 py-2 rounded-full bg-danger text-white text-button font-medium hover:opacity-90 transition-opacity duration-200`，點擊 `clearAll(); showConfirm = false`

### Script Setup 邏輯

```js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFavorites } from '@/composables/useFavorites.js'
import { spots } from '@/data/spotData.js'

const router = useRouter()
const { favorites, toggleFavorite, clearAll } = useFavorites()

const isOpen = ref(false)       // 控制 Drawer 開關
const showConfirm = ref(false)  // 控制 Confirm Modal 開關

// 依 favorites 陣列中的 id，從 spotData 取得完整景點物件
const favoriteSpots = computed(() =>
  favorites.value
    .map(id => spots.find(s => s.id === id))
    .filter(Boolean)  // 過濾孤兒資料（id 存在於 localStorage 但 spotData 中已無對應景點）
)
```

`filter(Boolean)` 的用途：`spots.find()` 找不到對應景點時會回傳 `undefined`；`filter(Boolean)` 把這些 `undefined` 濾掉，確保畫面不會因破資料而出錯。

---

## 配色系統

靈感來源：日本清新自然系觀光網站（米白底色 + 草綠雙層綠 + 點綴黃綠）。

配色定義於 `tailwind.config.js` 的 `theme.extend.colors`，在 template 中以 Tailwind class 使用（例如 `bg-primary`、`text-muted`）。

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // 背景
        'bg-base':   '#F5F0DC',   // 米白/奶油黃，主背景（body 背景色）
        'surface':   '#FFFFFF',   // 卡片、白色區塊

        // 主色（綠）
        'primary':   '#3A7D44',   // 草綠，主要按鈕、強調色
        'secondary': '#8DB84A',   // 黃綠，次要按鈕、hover、badge

        // 文字
        'ink':       '#2C2C2C',   // 主要文字
        'muted':     '#6B7280',   // 次要文字、說明文字

        // 邊框
        'border-soft':'#D9D3B8',  // 低調邊框、分隔線

        // 功能色
        'danger':    '#E05252',   // 刪除、警示
      },
      fontSize: {
        // 大標（頁面主標題）
        'heading-sm': '2.25rem',  // 手機版，對應原 text-4xl
        'heading-pc': '3rem',     // 桌機版，對應原 text-5xl

        // 小標（區塊標題、卡片標題、sidebar 選項）
        'subheading-sm': '1.25rem', // 手機版，對應原 text-xl
        'subheading-pc': '1.5rem',  // 桌機版，對應原 text-2xl

        // 內文（景點描述、地址、開放時間）
        'body':   '1rem',         // 對應原 text-base

        // 按鈕文字
        'button': '1rem',         // 對應原 text-base

        // 輔助文字（badge、label）
        'label':  '0.875rem',     // 對應原 text-sm
      }
    }
  }
}
```

---

## 樣式撰寫規範

- 樣式優先使用 Tailwind utility class 撰寫於 template 中
- 自訂配色一律在 `tailwind.config.js` 定義，不在元件內寫 inline style 色碼
- 僅在 Tailwind 無法處理的情況（如 Leaflet 地圖容器高度）才在 `<style>` 區塊補充原生 CSS
- RWD 斷點：手機優先（mobile-first），桌面斷點使用 Tailwind 的 `md:` 前綴（`≥ 768px`）

### 單位規範

| 場景 | 單位 | 寫法範例 |
|---|---|---|
| 文字大小 | rem（Tailwind token） | `text-body`、`text-heading-sm` |
| 元件內部小間距（按鈕 padding、icon gap） | Tailwind scale | `px-4`、`gap-2` |
| 版面級間距（卡片間距、grid gap、section 間距） | clamp()，使用 Tailwind 任意值 | `gap-[clamp(16px,3vw,32px)]`、`py-[clamp(32px,6vw,80px)]` |
| 容器比例留白（左右 margin） | %，使用 Tailwind 任意值 | `mx-[5%]` |

**說明：**
- 元件內部小間距用 Tailwind scale（背後為 rem），保持與整體設計系統的一致性
- 版面級間距用 clamp()，讓手機與桌面之間的過渡平滑，不出現跳躍切換
- clamp() 的三個參數依序為：最小值（手機下限）、理想值（依視窗寬度縮放）、最大值（桌面上限）
- 所有間距樣式一律寫在 template 的 class 中，不進 `<style>` 區塊

---

## HomeView 規範

### 版面結構

No-scroll Layout（無捲軸版面），整個首頁鎖定在一個螢幕高度內，不出現捲軸。

```
┌─────────────────────────────────┐  ← 100vh
│  Lottie 動畫背景（opacity: 0.12）│
│                                 │
│       Taiwan Travel（Eyebrow）  │
│      探索台灣旅遊景點（h1）      │
│     發掘你未曾發現的台灣之美     │
│                                 │
│  [ 互動地圖 ][ 收藏景點 ][ 探索縣市 ]  ← 膠囊標籤列
│                                 │
│        [ 開始探索 → ]           │
│                                 │
├─────────────────────────────────┤
│  © 2026 Brian. All rights reserved.  ← Footer
└─────────────────────────────────┘
```

### 實作細節

**整頁高度鎖定**

No-scroll Layout 靠版面設計自然達成，不強制鎖定 `overflow`。首頁內容本身不多（Eyebrow、標題、副標、膠囊列、按鈕、Footer），搭配適當的間距設定，自然放進一個畫面高度內，不需要 `onMounted` / `onUnmounted` 操作 `overflow-hidden`，也不需要 `:global()` 的 CSS 處理。

**Lottie 動畫背景**
- 使用 `@dotlottie/vue` 套件（npm 安裝），不需要在 `index.html` 加任何 `<script>`
- 在 `<script setup>` 引入：
  ```js
  import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
  ```
- 在 template 中使用：
  ```html
  <DotLottieVue
    src="https://lottie.host/8f28e7bb-34e2-48fd-b8a4-3669dea6d2e9/NNs77bJIOB.lottie"
    :autoplay="true"
    :loop="true"
  />
  ```
- 絕對定位鋪滿父容器，`opacity-50`，`pointer-events: none`
- 底色為 `bg-base (#F5F0DC)`

**Eyebrow 標籤**
- 文字：`Taiwan Travel`
- 樣式：細邊框膠囊，`text-label font-light`，顏色 `text-primary`，邊框 `border-secondary`

**主標題**
- 文字：`探索台灣旅遊景點`
- class：`text-heading-sm md:text-heading-pc font-bold`

**main 排版**
- 採用 `justify-center pb-[clamp(250px,20vw,288px)]`，讓內容視覺上偏上，間距使用 `gap-[clamp(24px,3vw,32px)]`

**副標題**
- 文字：`發掘你未曾發現的台灣之美`
- class：`text-subheading-sm md:text-subheading-pc font-normal text-muted`

**特色膠囊標籤列**
- 三個膠囊水平排列，手機版允許換行（`flex-wrap`），間距 `gap-[clamp(12px,2vw,16px)]`
- 半透明白色背景 `bg-white/70`，搭配 `backdrop-blur-sm`
- 內容與 icon：
  - `fa-map` 互動地圖
  - `fa-location-dot` 收藏景點
  - `fa-compass` 探索縣市

**開始探索按鈕**
- 文字：`開始探索`，右側 `fa-arrow-right` icon
- 樣式：`bg-primary text-white`，圓角膠囊
- 點擊：`router.push('/map')`

**Footer**
- 只出現在 HomeView，其他頁面不放 footer
- 文字：`© {{ new Date().getFullYear() }} Brian. All rights reserved.`
- 樣式：`text-label font-light text-muted`，半透明白色背景

---

## CityView 規範

### 版面結構

允許捲動（`min-h-screen`），整頁內容寬度限制在 `max-w-[1300px] mx-auto w-full`。

**整體結構圖**

```
┌─────────────────────────────────────┐  ← Sticky Header（z-index: 10）
│  歡迎來到 臺中市                     │  ← 第一列：歡迎標題（縣市名稱不同色）
│  ← 返回地圖                         │  ← 第二列：返回按鈕
│  [全部][自然風景][人文藝術][美食][古蹟] │  ← 第三列：5 個 filter 標籤
└─────────────────────────────────────┘
│  卡片 1                              │
│  卡片 2                              │  ← 捲動區域（正常文件流）
│  ...                                │
                              [⬆]        ← Go Top（bottom: 88px, right: 24px, fixed）
                              [♡]        ← FAB 收藏（bottom: 24px, right: 24px, fixed）
```

**手機版與桌機版**
- 兩者共用相同的單欄結構，差異僅在於 padding、字體大小透過 token 的 `md:` 斷點縮放
- 不做 Grid 多欄排列，維持單欄列表

### Sticky Header

Header 固定在頂部，使用者捲動景點列表時，歡迎標題、返回按鈕、filter 列始終可見。

**實作方式**
- 需在 `<style>` 補充原生 CSS：
  ```css
  .city-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #F5F0DC;
  }
  ```
  原因同 Leaflet 背景色規範：用 class selector 的原生 CSS 確保特異度高於其他樣式，背景色穩定覆蓋捲動內容。禁止只掛 Tailwind 的 `sticky top-0 bg-bg-base`，無法保證 z-index 與背景色的穩定性。

**容器結構**
- 外層加 `.city-header` class + `flex flex-col gap-[clamp(8px,1.5vw,12px)] px-[clamp(16px,4vw,40px)] pt-[clamp(16px,3vw,24px)] pb-[clamp(12px,2vw,16px)]`

**第一列：歡迎標題**
- HTML：`<h1>歡迎來到 <span class="text-secondary">{{ cityName }}</span></h1>`
- `cityName` 來源：從過濾後的景點陣列取第一筆的 `cityName` 欄位（例如「臺中市」）
- class：`text-heading-sm md:text-heading-pc font-bold text-ink`

**第二列：返回按鈕**
- 內容：`fa-arrow-left` icon + 文字「返回地圖」
- class：`text-button font-medium text-primary flex items-center gap-2`
- 點擊：`router.push('/map')`

**第三列：Filter 列**
- 容器：`flex flex-wrap gap-2`
- 選項（固定 5 個）：全部 / 自然風景 / 人文藝術 / 美食 / 古蹟
- 預設選中「全部」
- 選中狀態：`bg-primary text-white border-transparent`
- 未選中狀態：`bg-surface text-ink border border-border-soft`
- 按鈕共用 class：`text-label rounded-full px-4 py-1 transition-colors duration-200`
- 篩選邏輯：選「全部」顯示所有景點；選其他類別時，只顯示 `spot.category === activeFilter` 的景點

### 景點卡片

**卡片結構圖**

```
卡片外層 div（整張可點擊，@click 進入 SpotView）
│
├── 圖片區 div（三段式 RWD：<500px 滿版寬、500–768px 150px、≥768px 200px）
│   └── <img>（三段式比例：<500px 4:3、500–768px 1:1、≥768px 4:3，w-full object-cover）
│       ※ 無圖片時改為 bg-border-soft + fa-image icon 置中（text-muted）
│
└── 文字區 div（min-w-0 flex-1 p-3 pt-0 flex flex-col justify-between gap-2）
    │
    ├── 第一行 div（flex items-center justify-between gap-2）
    │   ├── 景點名稱 <span>（truncate，超出截斷）
    │   └── 愛心按鈕 <button>（@click.stop 攔截冒泡）
    │       ├── 收藏中：fa-heart，text-danger
    │       └── 未收藏：fa-heart，text-muted
    │
    ├── 類別 badge <span>（self-start，不拉滿整行）
    │
    └── 描述文字 <p>（line-clamp-2，超過兩行截斷）
```

**卡片列表容器**
- `flex flex-col gap-[clamp(12px,2vw,16px)] px-[clamp(16px,4vw,40px)] py-[clamp(16px,3vw,24px)]`

**卡片外層**
- `bg-surface rounded-xl border border-border-soft overflow-hidden flex flex-col min-[500px]:flex-row gap-4 cursor-pointer hover:shadow-md transition-shadow duration-200`（`<500px` 圖片在上、文字在下；`≥500px` 恢復左右並排）
- 點擊事件：`@click="router.push('/map/' + route.params.city + '/' + spot.id)"`

**圖片區（三段式 RWD，實測後調整為與規劃不同的斷點組合）**
- 容器：`w-full min-[500px]:w-[150px] md:w-[200px] shrink-0`
- 圖片：`<img :src="spot.images[0]">` + `aspect-[4/3] min-[500px]:aspect-square md:aspect-[4/3] w-full object-cover`
- 無圖片 fallback：`bg-border-soft flex items-center justify-center aspect-[4/3] min-[500px]:aspect-square md:aspect-[4/3]` + `<i class="fas fa-image text-muted" />`
- 說明：`<500px` 堆疊排列時圖片維持 `4:3`；`500–768px`（左右並排、圖片寬度縮到 150px）改用 `1:1` 正方形比較好看；`≥768px`（圖片寬度回到 200px）再改回 `4:3`。三個斷點的圖文比例是實際測試調整出來的結果，不是預先規劃好的固定規則
- **不可加 `h-full`**：`<img>` 若同時設定 `w-full` 與 `h-full`，會讓寬高都變成明確值，導致 `aspect-[...]` 完全失效（CSS 規則：寬高皆為明確值時，`aspect-ratio` 不介入計算）。圖片容器是 flex row 的子項，預設 `align-items: stretch` 會讓容器高度被撐到跟文字側等高；若圖片再用 `h-full` 撐滿容器，會讓圖片高度依賴文字側內容多寡，而非固定比例。目前因文字側有 `line-clamp-2` 限制高度、通常不會超過圖片依比例算出的自然高度，兩者恰好不衝突，但這是內容巧合、非穩固保證，因此明確禁止加 `h-full`，高度一律交給 `aspect-[...]` 決定

**文字區**
- 容器：`min-w-0 flex-1 p-3 pt-0 min-[500px]:pt-3 flex flex-col justify-between gap-2`（`<500px` 堆疊時圖片與文字區之間已有卡片的 `gap-4`，文字區自身的 `padding-top` 會造成雙重留白，因此 `<500px` 去除 `pt`，`≥500px` 左右並排時才需要 `pt-3` 撐開文字與卡片上緣的距離）
  - 景點名稱：`text-subheading-sm font-medium text-ink truncate`
  - 愛心按鈕：`shrink-0`，收藏中 `text-danger`，未收藏 `text-muted`，icon 用行內 `style="font-size: 1.5rem"` 放大（預設 1rem 太小，FontAwesome icon 尺寸不屬於文字 token 管轄範圍，允許直接設定）
- 類別 badge：`self-start px-2 py-0.5 rounded-full bg-primary/10 text-label text-primary`
- 描述文字：`text-body text-muted line-clamp-2`

**愛心按鈕事件說明**
- `.stop` 修飾符呼叫 `event.stopPropagation()`，阻止 click 事件往上冒泡至卡片外層
- 確保點擊愛心只觸發 `toggleFavorite()`，不觸發卡片的 `router.push()`

### Go Top 按鈕

- 位置：`position: fixed; bottom: 88px; right: 24px`（在 FAB 收藏按鈕正上方）
- 樣式：圓形，`w-12 h-12 rounded-full bg-surface border border-border-soft shadow-md flex items-center justify-center`，內部 `fa-chevron-up text-ink`
- 顯示條件：`scrollY > 300`，用 `v-show` 控制（保留 DOM，避免重複建立）
- 監聽：`onMounted` 加 `window.addEventListener('scroll', handleScroll)`；`onUnmounted` 移除，避免記憶體洩漏
- 點擊：`window.scrollTo({ top: 0, behavior: 'smooth' })`

Go Top 按鈕（`⬆`）與 FAB 收藏按鈕（`♡`）均已實作完成。

### 資料邏輯

```js
// script setup 內
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { spots } from '@/data/spotData.js'

const route = useRoute()
const router = useRouter()

const activeFilter = ref('全部')

const citySpots = computed(() =>
  spots.filter(spot => spot.city === route.params.city)
)

const cityName = computed(() =>
  citySpots.value[0]?.cityName ?? ''
)

const filteredSpots = computed(() =>
  activeFilter.value === '全部'
    ? citySpots.value
    : citySpots.value.filter(spot => spot.category === activeFilter.value)
)
```

- `citySpots`：依 route 參數過濾出該縣市所有景點
- `cityName`：從第一筆景點取 `cityName`，用於標題顯示
- `filteredSpots`：在 `citySpots` 基礎上再依類別過濾，template 迭代此陣列
- `citySpots` 為空陣列時，依既有規範顯示「找不到此縣市」提示畫面（`v-if`），不導頁

---

## SpotView 規範

### 版面結構

允許捲動（`min-h-screen`），整頁內容寬度限制在 `max-w-[1300px] mx-auto w-full`。

**整體結構圖（桌機，≥768px）**

```
┌─────────────────────────────────────────────┐  ← Header（非 sticky）
│  ← 返回 臺中市                    返回地圖  │
└─────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────┐  ← 兩欄並排
│                  │  景點名稱                 │
│     主圖         │  badge  ♡                │
│  w-[480px]       │  ────────────────────    │
│  aspect-[2/3]    │  描述文字                 │
│  object-cover    │  ────────────────────    │
│                  │  📍 地址                  │
│                  │  🕐 開放時間              │
│                  │  📞 電話                  │
│                  │  🌐 官網（v-if）          │
└──────────────────┴──────────────────────────┘
                                      [⬆]  ← Go Top（bottom: 88px）
                                      [♡]  ← FAB（bottom: 24px）
```

**手機版（<768px）**

```
┌──────────────────────────────┐
│  ← 返回 臺中市    返回地圖   │  ← Header
├──────────────────────────────┤
│  主圖（w-full aspect-[4/3]） │
├──────────────────────────────┤
│  景點名稱                     │
│  badge  ♡                    │
│  ──────────────────────────  │
│  描述文字                     │
│  ──────────────────────────  │
│  📍 地址                      │
│  🕐 開放時間                  │
│  📞 電話                      │
│  🌐 官網（v-if）              │
└──────────────────────────────┘
```

### Header

非 sticky，隨頁面捲動。

- 容器：`flex items-center justify-between px-[clamp(16px,4vw,40px)] pt-[clamp(16px,3vw,24px)] pb-[clamp(12px,2vw,16px)]`
- 左側「返回列表」按鈕：`fa-arrow-left` icon + 文字「返回 {{ cityName }}」，class `text-button font-medium text-primary flex items-center gap-2`，點擊 `router.push('/map/' + route.params.city)`
- 右側「返回地圖」按鈕：文字「返回地圖」+ `fa-map` icon，class `text-button font-medium text-muted flex items-center gap-2 hover:text-primary transition-colors duration-200`，點擊 `router.push('/map')`

左側主要動作用 `text-primary`，右側次要動作用 `text-muted`，視覺上製造權重差異。

### 兩欄容器

- 外層：`flex flex-col md:flex-row gap-[clamp(24px,4vw,48px)] px-[clamp(16px,4vw,40px)] pb-[clamp(24px,4vw,48px)]`

### 左欄：圖片區

- 容器：`w-full md:w-[480px] shrink-0`（`w-[480px]` 為起點，視實際效果可調整，高度由 `aspect-ratio` 自動計算）
- 圖片：`<img :src="spot.images[0]">` + `w-full aspect-[4/3] md:aspect-[2/3] object-cover rounded-xl`
- 無圖片 fallback：`w-full aspect-[4/3] md:aspect-[2/3] rounded-xl bg-border-soft flex items-center justify-center` + `fa-image text-muted`，`style="font-size: 2rem"`

### 右欄：資訊區

- 容器：`min-w-0 flex-1 flex flex-col gap-[clamp(16px,3vw,24px)]`

**標題區塊**
- 景點名稱：`text-heading-sm md:text-heading-pc font-bold text-ink`
- 第二行容器：`flex items-center justify-between gap-2`
  - 類別 badge：`self-start px-3 py-1 rounded-full bg-primary/10 text-label text-primary`
  - 愛心按鈕：收藏中 `text-danger`，未收藏 `text-muted`，`style="font-size: 1.5rem"`，點擊 `toggleFavorite(spot.id)`（FontAwesome icon 尺寸不屬於文字 token 管轄範圍，允許直接設定）

**分隔線**：`<hr class="border-border-soft">`

**描述區塊**
- `<p class="text-body text-ink leading-relaxed">{{ spot.description }}</p>`

**分隔線**：`<hr class="border-border-soft">`

**資訊區塊**
- 容器：`flex flex-col gap-3`
- 每一列結構：`flex items-start gap-3`
  - Icon 容器：`w-5 shrink-0 flex justify-center pt-0.5`，icon `style="font-size: 1rem"` + `text-primary`
  - 文字：`text-body text-ink`
- 各列 icon 對應：
  - 地址：`fa-location-dot`，文字 `{{ spot.address }}`
  - 開放時間：`fa-clock`，文字 `{{ spot.openTime }}`
  - 電話：`fa-phone`，文字 `{{ spot.phone }}`
  - 官網：`fa-globe`，以 `v-if="spot.website"` 條件渲染，文字改為 `<a :href="spot.website" target="_blank" rel="noopener noreferrer" class="text-body text-primary hover:underline">{{ spot.website }}</a>`

### 找不到景點時的提示畫面

`spot` 為 `null` 時以 `v-if` 切換至提示畫面，不導頁（與 CLAUDE.md 既有規範一致）。

- 標題：「找不到此景點」
- 說明：「很抱歉，找不到您要查看的景點資訊。」
- 按鈕：「瀏覽其他地區」→ 優先 `router.push('/map/' + route.params.city)`，若 city 無效則 `router.push('/map')`

### Go Top 按鈕

與 CityView 規格完全相同：
- 位置：`fixed bottom-[88px] right-6 z-50`
- 樣式：`w-12 h-12 rounded-full bg-surface border border-border-soft shadow-md flex items-center justify-center`，內部 `fa-chevron-up text-ink`
- 顯示條件：`scrollY > 300`，`v-show` 控制
- 監聽：`onMounted` 加 `window.addEventListener('scroll', handleScroll)`；`onUnmounted` 移除

### 資料邏輯

```js
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { spots } from '@/data/spotData.js'
import { useFavorites } from '@/composables/useFavorites.js'

const route = useRoute()
const router = useRouter()
const { isFavorite, toggleFavorite } = useFavorites()

// spot 為 null 代表找不到景點，顯示提示畫面
const spot = computed(() =>
  spots.find(s => s.id === route.params.spotId) ?? null
)

// 用於 Header 左側按鈕文字「返回 臺中市」
const cityName = computed(() =>
  spot.value?.cityName ?? ''
)

// Go Top
const showGoTop = ref(false)
const handleScroll = () => { showGoTop.value = window.scrollY > 300 }
onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
```

### 連帶修改項目

SpotView 實作時需同步修改以下三個檔案：

| 檔案 | 修改內容 |
|---|---|
| `spotData.js` | `image` 欄位改為 `images: []` 陣列；新增 `website` 欄位（無官網填 `null`） |
| `CityView.vue` | 卡片圖片來源從 `spot.image` 改為 `spot.images[0]` |
| `FavoritesDrawer.vue` | 縮圖來源從 `spot.image` 改為 `spot.images[0]` |

---

## NotFoundView 規範

### 版面結構

全頁垂直水平置中，不捲動。背景色 `bg-bg-base`。

```
┌─────────────────────────────┐  ← min-h-screen
│                             │
│      ⊙  （圓形 icon 底座）   │
│                             │
│     找不到此頁面             │
│  很抱歉，您要瀏覽的頁面不存在。│
│                             │
│      [ ← 返回首頁 ]         │
│                             │
└─────────────────────────────┘
```

根容器：`min-h-screen bg-bg-base flex flex-col items-center justify-center gap-[clamp(16px,3vw,24px)] px-6 text-center`

### Icon 圓形底座

- 容器：`w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center`
- Icon：`fa-compass`，`text-primary`，`style="font-size: 2.5rem"`（FontAwesome icon 尺寸不屬於文字 token 管轄範圍，允許直接設定）

### 標題

- 文字：「找不到此頁面」
- class：`text-heading-sm md:text-heading-pc font-bold text-ink`

### 說明文字

- 文字：「很抱歉，您要瀏覽的頁面不存在。」
- class：`text-body text-muted`

### 返回首頁按鈕

- 內容：`fa-arrow-left` icon + 文字「返回首頁」
- 樣式：與 HomeView「開始探索」按鈕一致，`bg-primary text-white text-button font-medium rounded-full px-7 py-2.5 flex items-center gap-2`
- 點擊：`router.push('/')`

### 與其他「找不到」畫面的 Icon 對照

三個情境共用相同的版面結構（圓形底座 + icon + 標題 + 說明 + 按鈕），僅 icon 與文案不同：

| 畫面 | Icon | 標題 | 說明 |
|---|---|---|---|
| NotFoundView（404） | `fa-compass` | 找不到此頁面 | 很抱歉，您要瀏覽的頁面不存在。 |
| CityView 找不到縣市 | `fa-map` | 找不到此縣市 | 很抱歉，找不到您要瀏覽的縣市，請返回地圖重新選擇。 |
| SpotView 找不到景點 | `fa-magnifying-glass` | 找不到此景點 | 很抱歉，找不到您要查看的景點資訊。 |

CityView／SpotView 的提示畫面為 `v-if` 條件渲染，根容器改用 `min-h-[60vh]`（不撐滿全頁，因為它嵌在有 header 的頁面內）；NotFoundView 為獨立頁面，根容器使用 `min-h-screen`。

### Script Setup 邏輯

```js
import { useRouter } from 'vue-router'

const router = useRouter()
```

無需引入任何資料或 composable，邏輯極簡：只有一個 `router.push('/')` 的點擊事件。

---

## 元件結構建議

```
src/
├── assets/
│   └── main.css              # Tailwind 指令（@tailwind base/components/utilities）
├── components/
│   └── FavoritesDrawer.vue   # FAB + Drawer（收藏功能）
├── composables/
│   └── useFavorites.js       # 收藏邏輯（localStorage 讀寫）
├── data/
│   ├── spotData.js           # 景點靜態資料（單一資料來源）
│   └── taiwan-country.topo.json
├── router/
│   └── index.js
└── views/
    ├── HomeView.vue
    ├── MapView.vue
    ├── CityView.vue
    ├── SpotView.vue
    └── NotFoundView.vue
tailwind.config.js            # 自訂配色 token 定義於此
```

---

## 禁止事項

- 禁止使用 Options API（`export default { data(), methods: {} }`）
- 禁止在元件內直接操作 `localStorage`，一律透過 `useFavorites.js`
- 禁止在 template 內寫 inline style 色碼，一律使用 `tailwind.config.js` 定義的 token class
- 禁止引入 Pinia、Vuex 或任何狀態管理套件
- 禁止使用 Bootstrap、Ant Design Vue 或其他 CSS 框架
- 禁止在元件內寫死景點資料，一律從 `spotData.js` 引入
- 禁止使用 `clamp()` 處理**字體大小**，禁止在 template 直接寫 Tailwind 內建尺寸 class（如 `text-2xl`、`text-lg`），字體大小一律使用 `tailwind.config.js` 定義的 token（如 `text-body`、`text-heading-sm`）
- 禁止使用 Tailwind 預設 scale 的間距 class 用於版面級間距；元件內部小間距用 Tailwind scale（如 `px-4`、`gap-2`），版面級間距用 clamp()（如 `gap-[clamp(16px,3vw,32px)]`）
