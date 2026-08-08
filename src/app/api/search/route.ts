import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || ''
  if (!query) return NextResponse.json({ results: [] })

  const results: any[] = []

  // ── Open Food Facts (produtos brasileiros) ──
  try {
    const offRes = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&lc=pt&countries=Brazil`,
      { next: { revalidate: 3600 } }
    )
    const offData = await offRes.json()
    for (const p of (offData.products || []).slice(0, 4)) {
      const n = p.nutriments || {}
      if (!n['energy-kcal_100g'] && !n['energy-kcal']) continue
      results.push({
        id: `off_${p.code || Math.random()}`,
        name: p.product_name_pt || p.product_name || p.generic_name || 'Produto',
        brand: p.brands || '',
        kcal: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
        prot: Math.round((n['proteins_100g'] || 0) * 10) / 10,
        carb: Math.round((n['carbohydrates_100g'] || 0) * 10) / 10,
        fat:  Math.round((n['fat_100g'] || 0) * 10) / 10,
        unit: 'g',
        source: 'Open Food Facts',
      })
    }
  } catch {}

  // ── USDA FoodData Central (alimentos in natura) ──
  try {
    const usdaKey = process.env.USDA_API_KEY || 'DEMO_KEY'
    const usdaRes = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=4&dataType=SR%20Legacy,Foundation&api_key=${usdaKey}`,
      { next: { revalidate: 3600 } }
    )
    const usdaData = await usdaRes.json()
    for (const f of (usdaData.foods || []).slice(0, 3)) {
      const nuts = f.foodNutrients || []
      const get = (id: number) => Math.round(((nuts.find((n: any) => n.nutrientId === id)?.value) || 0) * 10) / 10
      results.push({
        id: `usda_${f.fdcId}`,
        name: f.description || 'Alimento',
        brand: '',
        kcal: get(1008),
        prot: get(1003),
        carb: get(1005),
        fat:  get(1004),
        unit: 'g',
        source: 'USDA',
      })
    }
  } catch {}

  return NextResponse.json({ results: results.filter(r => r.kcal > 0).slice(0, 6) })
}
