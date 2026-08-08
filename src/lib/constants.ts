export const GOALS = { kcal: 3150, prot: 135, carb: 440, fat: 95 }

export const C = {
  bg: '#080B10',
  surface: '#0F1318',
  card: '#141920',
  border: '#1E2530',
  borderLight: '#252E3A',
  kcal: '#F97316',
  prot: '#3B82F6',
  carb: '#A855F7',
  fat: '#22C55E',
  text: '#E2E8F0',
  muted: '#64748B',
  dim: '#334155',
  accent: '#6366F1',
}

export interface FoodItem {
  id: string
  name: string
  brand?: string
  kcal: number
  prot: number
  carb: number
  fat: number
  unit: 'g' | 'ml' | 'copo' | 'un'
  source?: string
}

export interface MealEntry {
  id: number
  name: string
  kcal: number
  prot: number
  carb: number
  fat: number
}

export const DEFAULT_LIBRARY: FoodItem[] = [
  { id: 'arroz',     name: 'Arroz branco cozido',       kcal: 128, prot: 2.5,  carb: 28.1, fat: 0.2,  unit: 'g' },
  { id: 'frango',    name: 'Frango grelhado',            kcal: 163, prot: 31.0, carb: 0,    fat: 4.0,  unit: 'g' },
  { id: 'feijao',    name: 'Feijão cozido',              kcal: 76,  prot: 4.8,  carb: 13.6, fat: 0.5,  unit: 'g' },
  { id: 'ovo',       name: 'Ovo inteiro',                kcal: 143, prot: 13.3, carb: 0.5,  fat: 9.5,  unit: 'g' },
  { id: 'leite',     name: 'Leite integral',             kcal: 64,  prot: 3.0,  carb: 5.9,  fat: 3.2,  unit: 'ml' },
  { id: 'banana',    name: 'Banana nanica',              kcal: 92,  prot: 1.4,  carb: 23.8, fat: 0.1,  unit: 'g' },
  { id: 'pao',       name: 'Pão de Forma Panco',         kcal: 256, prot: 5.0,  carb: 47.0, fat: 2.0,  unit: 'g' },
  { id: 'mucilon',   name: 'Mucilon Arroz e Aveia',      kcal: 376, prot: 6.7,  carb: 85.7, fat: 0.0,  unit: 'g' },
  { id: 'aveia_f',   name: 'Aveia em flocos Yoki',       kcal: 350, prot: 14.0, carb: 57.0, fat: 7.3,  unit: 'g' },
  { id: 'aveia_fa',  name: 'Farinha de Aveia Yoki',      kcal: 394, prot: 13.9, carb: 66.6, fat: 8.5,  unit: 'g' },
  { id: 'requeijao', name: 'Requeijão',                  kcal: 253, prot: 10.0, carb: 10.0, fat: 22.0, unit: 'g' },
  { id: 'acucar',    name: 'Açúcar',                     kcal: 387, prot: 0,    carb: 100,  fat: 0,    unit: 'g' },
  { id: 'mel',       name: 'Mel',                        kcal: 309, prot: 0,    carb: 84.0, fat: 0,    unit: 'g' },
  { id: 'tang_l',    name: 'Suco Tang Laranja (copo)',   kcal: 12,  prot: 0,    carb: 2.4,  fat: 0,    unit: 'copo' },
  { id: 'tang_u',    name: 'Suco Tang Uva (copo)',       kcal: 12,  prot: 0,    carb: 2.4,  fat: 0,    unit: 'copo' },
  { id: 'linguica',  name: 'Linguiça grelhada',          kcal: 296, prot: 23.2, carb: 0,    fat: 21.9, unit: 'g' },
  { id: 'mussarela', name: 'Queijo mussarela',           kcal: 315, prot: 21.6, carb: 0.4,  fat: 25.0, unit: 'g' },
  { id: 'doce_l',    name: 'Doce de leite',              kcal: 306, prot: 5.5,  carb: 59.5, fat: 6.0,  unit: 'g' },
  { id: 'whey',      name: 'Piracanjuba ProForce (250ml)',kcal: 153, prot: 23.0, carb: 8.0,  fat: 1.0,  unit: 'un' },
]

export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function calcNutrients(item: FoodItem, qty: number) {
  const mult = (item.unit === 'copo' || item.unit === 'un') ? qty : qty / 100
  return {
    kcal: Math.round(item.kcal * mult * 10) / 10,
    prot: Math.round(item.prot * mult * 10) / 10,
    carb: Math.round(item.carb * mult * 10) / 10,
    fat:  Math.round(item.fat  * mult * 10) / 10,
  }
}
