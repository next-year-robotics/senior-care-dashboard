import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/** SOS 위치 지도. OpenStreetMap 타일(키 없음). 좌표는 SOS가 열려 있는 동안만 화면에 있다(저장하지 않는다). */
export function SosMap({ lat, lon, accuracy }: { lat: number; lon: number; accuracy: number | null }) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layers = useRef<L.LayerGroup | null>(null)
  useEffect(() => {
    if (!box.current) return
    const m = L.map(box.current, { zoomControl: true, attributionControl: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    map.current = m
    layers.current = L.layerGroup().addTo(m)
    return () => { m.remove(); map.current = null; layers.current = null }
  }, [])
  useEffect(() => {
    const m = map.current, g = layers.current
    if (!m || !g) return
    g.clearLayers()
    const at = L.latLng(lat, lon)
    if (accuracy != null && accuracy > 0) L.circle(at, { radius: accuracy, color: '#A43A38', weight: 1, fillOpacity: 0.12 }).addTo(g)
    L.circleMarker(at, { radius: 11, color: '#FFFFFF', weight: 3, fillColor: '#A43A38', fillOpacity: 1 }).addTo(g)
      .bindTooltip('어르신 폰 위치', { permanent: true, direction: 'top', offset: [0, -12] })
    m.setView(at, accuracy != null && accuracy > 150 ? 15 : 17)
  }, [lat, lon, accuracy])
  return <div ref={box} className="h-72 w-full overflow-hidden rounded-xl sm:h-96" role="img" aria-label="어르신 폰 위치 지도" />
}
