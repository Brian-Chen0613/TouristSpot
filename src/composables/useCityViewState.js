const cityStates = {}

export function useCityViewState() {
  const saveState = (city, filter, scrollY) => {
    cityStates[city] = { filter, scrollY }
  }

  const getState = (city) => cityStates[city] ?? null

  return { saveState, getState }
}
