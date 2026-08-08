'use client'
import { useState, useEffect, useRef } from 'react'
import { GOALS, C, DEFAULT_LIBRARY, todayKey, calcNutrients } from '@/lib/constants'
import type { FoodItem, MealEntry } from '@/lib/constants'

// ─── Storage helpers ──────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Progress Ring ────────────────────────────────────────
function ProgressRing({ value, goal, color, label, unit }: { value:number; goal:number; color:string; label:string; unit:string }) {
  const pct = Math.min(value / goal, 1)
  const over = value > goal
  const r = 30, stroke = 5
  const circ = 2 * Math.PI * r
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{ position:'relative', width:74, height:74 }}>
        <svg width={74} height={74} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={37} cy={37} r={r} fill="none" stroke={C.border} strokeWidth={stroke}/>
          <circle cx={37} cy={37} r={r} fill="none"
            stroke={over ? '#EF4444' : color} strokeWidth={stroke}
            strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
            style={{ transition:'stroke-dasharray 0.5s ease' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:12, fontWeight:800, color: over?'#EF4444':color, lineHeight:1 }}>
            {value < 10 ? value.toFixed(1) : Math.round(value)}
          </span>
          <span style={{ fontSize:8, color:C.muted }}>{unit}</span>
        </div>
      </div>
      <span style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:1 }}>{label}</span>
      <span style={{ fontSize:9, color: over?'#EF4444':C.dim }}>
        {over ? `+${Math.round(Math.abs(goal-value)*10)/10}` : Math.round((goal-value)*10)/10} rest.
      </span>
    </div>
  )
}

// ─── Qty Control ──────────────────────────────────────────
function QtyControl({ value, onChange, unit, step=5, min=0 }: { value:number; onChange:(v:number)=>void; unit:string; step?:number; min?:number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, background:C.bg, borderRadius:8, padding:'4px 8px', border:`1px solid ${C.border}` }}>
      <button onClick={() => onChange(Math.max(min, value-step))}
        style={{ width:26, height:26, borderRadius:6, border:'none', background:C.border, color:C.text, cursor:'pointer', fontSize:16, fontWeight:700 }}>−</button>
      <input type="number" value={value}
        onChange={e => onChange(Math.max(min, Number(e.target.value)||0))}
        style={{ width:52, textAlign:'center', background:'transparent', border:'none', color:C.text, fontSize:13, fontWeight:700, outline:'none' }}/>
      <span style={{ fontSize:11, color:C.muted, minWidth:22 }}>{unit}</span>
      <button onClick={() => onChange(value+step)}
        style={{ width:26, height:26, borderRadius:6, border:'none', background:C.border, color:C.text, cursor:'pointer', fontSize:16, fontWeight:700 }}>+</button>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────
function Toast({ msg }: { msg:string }) {
  return (
    <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', background:C.accent, color:'#fff',
      padding:'10px 20px', borderRadius:20, fontSize:13, fontWeight:600, zIndex:9999, boxShadow:'0 4px 20px #0008',
      whiteSpace:'nowrap', pointerEvents:'none' }}>
      {msg}
    </div>
  )
}

// ─── MACRO TAG ────────────────────────────────────────────
function MacroTag({ k, val, suf }: { k:string; val:number; suf:string }) {
  const colors: Record<string,string> = { kcal:C.kcal, prot:C.prot, carb:C.carb, fat:C.fat }
  return <span style={{ fontSize:11, color:colors[k], fontWeight:700 }}>{val}{suf}</span>
}

const INP: React.CSSProperties = {
  background: C.bg, border:`1px solid ${C.border}`, borderRadius:8,
  color: C.text, padding:'10px 12px', fontSize:13, outline:'none', width:'100%'
}

// ─── MAIN ─────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState<'tracker'|'library'|'search'|'manual'>('tracker')
  const [meals, setMeals] = useState<MealEntry[]>([])
  const [library, setLibrary] = useState<FoodItem[]>(DEFAULT_LIBRARY)
  const [libQtys, setLibQtys] = useState<Record<string,number>>({})
  const [flashId, setFlashId] = useState<number|null>(null)
  const [toast, setToast] = useState<string|null>(null)
  const [libSearch, setLibSearch] = useState('')

  // Busca de alimentos
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [searching, setSearching] = useState(false)
  const [searchQtys, setSearchQtys] = useState<Record<string,number>>({})

  // Manual
  const [mName, setMName] = useState('')
  const [mQty, setMQty]   = useState(100)
  const [mKcal, setMKcal] = useState('')
  const [mProt, setMProt] = useState('')
  const [mCarb, setMCarb] = useState('')
  const [mFat,  setMFat]  = useState('')

  // Novo alimento pra biblioteca
  const [showNewFood, setShowNewFood] = useState(false)
  const [nf, setNf] = useState({ name:'', kcal:'', prot:'', carb:'', fat:'', unit:'g' as FoodItem['unit'] })

  // Load
  useEffect(() => {
    setMeals(lsGet<MealEntry[]>(`meals-${todayKey()}`, []))
    const saved = lsGet<FoodItem[]|null>('food-library', null)
    if (saved && saved.length > 0) setLibrary(saved)
  }, [])

  function saveMeals(updated: MealEntry[]) {
    setMeals(updated)
    lsSet(`meals-${todayKey()}`, updated)
  }

  function saveLibrary(updated: FoodItem[]) {
    setLibrary(updated)
    lsSet('food-library', updated)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function flash(id: number) {
    setFlashId(id)
    setTimeout(() => setFlashId(null), 2200)
  }

  // Busca API
  const searchTimeout = useRef<NodeJS.Timeout>()
  function doSearch(q: string) {
    setSearchQ(q)
    clearTimeout(searchTimeout.current)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch {
        setSearchResults([])
      }
      setSearching(false)
    }, 600)
  }

  function addMeal(item: FoodItem, qty: number, fromSearch=false) {
    const n = calcNutrients(item, qty)
    const meal: MealEntry = { id: Date.now(), name: `${item.name}${item.brand?' ('+item.brand+')':''} · ${qty}${item.unit}`, ...n }
    const updated = [...meals, meal]
    saveMeals(updated)
    flash(meal.id)
    showToast(`${item.name} adicionado!`)
    if (!fromSearch) setLibQtys(q => ({ ...q, [item.id]: item.unit==='copo'||item.unit==='un' ? 1 : 100 }))
  }

  function addManual() {
    if (!mName.trim() || !mKcal) return
    const mult = mQty / 100
    const meal: MealEntry = {
      id: Date.now(),
      name: `${mName.trim()} · ${mQty}g`,
      kcal: Math.round((Number(mKcal)||0)*mult*10)/10,
      prot: Math.round((Number(mProt)||0)*mult*10)/10,
      carb: Math.round((Number(mCarb)||0)*mult*10)/10,
      fat:  Math.round((Number(mFat)||0)*mult*10)/10,
    }
    saveMeals([...meals, meal])
    flash(meal.id)
    showToast('Refeição adicionada!')
    setMName(''); setMQty(100); setMKcal(''); setMProt(''); setMCarb(''); setMFat('')
  }

  function saveManualToLib() {
    if (!mName.trim()||!mKcal) { showToast('Preencha nome e kcal.'); return }
    const item: FoodItem = { id: Date.now().toString(), name:mName.trim(), kcal:Number(mKcal)||0, prot:Number(mProt)||0, carb:Number(mCarb)||0, fat:Number(mFat)||0, unit:'g' }
    saveLibrary([...library, item])
    showToast('Salvo na biblioteca!')
  }

  function addSearchToLib(item: FoodItem) {
    if (library.find(f => f.id === item.id)) { showToast('Já está na biblioteca!'); return }
    saveLibrary([...library, item])
    showToast(`${item.name} salvo na biblioteca!`)
  }

  function addNewFood() {
    if (!nf.name.trim()||!nf.kcal) return
    const item: FoodItem = { id: Date.now().toString(), name:nf.name.trim(), kcal:Number(nf.kcal)||0, prot:Number(nf.prot)||0, carb:Number(nf.carb)||0, fat:Number(nf.fat)||0, unit:nf.unit }
    saveLibrary([...library, item])
    setNf({ name:'', kcal:'', prot:'', carb:'', fat:'', unit:'g' })
    setShowNewFood(false)
    showToast('Alimento salvo!')
  }

  const totals = meals.reduce((acc,m) => ({ kcal:acc.kcal+m.kcal, prot:acc.prot+m.prot, carb:acc.carb+m.carb, fat:acc.fat+m.fat }), { kcal:0, prot:0, carb:0, fat:0 })
  const filtLib = library.filter(f => f.name.toLowerCase().includes(libSearch.toLowerCase()))

  const TABS = [['tracker','📊'],['library','🍽️'],['search','🔍'],['manual','✏️']] as const

  return (
    <div style={{ background:C.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:80 }}>
      {toast && <Toast msg={toast}/>}

      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:'14px 16px 0', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ textAlign:'center', marginBottom:10 }}>
          <p style={{ fontSize:9, letterSpacing:4, color:C.accent, textTransform:'uppercase', margin:'0 0 2px' }}>SUPERÁVIT · HIPERTROFIA</p>
          <h1 style={{ fontSize:18, fontWeight:900, margin:0, background:'linear-gradient(135deg, #F97316, #A855F7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Nutrition Tracker
          </h1>
          <p style={{ fontSize:9, color:C.muted, margin:'2px 0 0', fontFamily:'monospace' }}>{todayKey()}</p>
        </div>
        <div style={{ display:'flex', gap:2 }}>
          {TABS.map(([key,icon]) => (
            <button key={key} onClick={() => setTab(key as any)}
              style={{ flex:1, padding:'8px 2px', border:'none', borderRadius:'8px 8px 0 0', cursor:'pointer', fontSize:11, fontWeight:700,
                background: tab===key ? C.bg : 'transparent', color: tab===key ? C.text : C.muted,
                borderBottom: tab===key ? `2px solid ${C.accent}` : '2px solid transparent',
                transition:'all 0.2s' }}>
              {icon} {key === 'tracker' ? 'Hoje' : key === 'library' ? 'Biblioteca' : key === 'search' ? 'Buscar' : 'Manual'}
            </button>
          ))}
        </div>
      </div>

      {/* ── TRACKER ── */}
      {tab === 'tracker' && (
        <div style={{ padding:16 }}>
          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:'16px 8px', marginBottom:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 }}>
              <ProgressRing value={Math.round(totals.kcal)} goal={GOALS.kcal} color={C.kcal} label="Kcal" unit="kcal"/>
              <ProgressRing value={Math.round(totals.prot*10)/10} goal={GOALS.prot} color={C.prot} label="Prot" unit="g"/>
              <ProgressRing value={Math.round(totals.carb*10)/10} goal={GOALS.carb} color={C.carb} label="Carb" unit="g"/>
              <ProgressRing value={Math.round(totals.fat*10)/10} goal={GOALS.fat} color={C.fat} label="Fat" unit="g"/>
            </div>
          </div>

          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, overflow:'hidden' }}>
            <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:C.muted }}>Refeições de hoje</span>
              {meals.length > 0 && (
                <button onClick={() => { if(window.confirm('Zerar o dia?')) saveMeals([]) }}
                  style={{ fontSize:11, color:'#EF4444', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Zerar</button>
              )}
            </div>

            {meals.length === 0 ? (
              <div style={{ padding:'40px 16px', textAlign:'center' }}>
                <p style={{ fontSize:30, margin:0 }}>🍽️</p>
                <p style={{ fontSize:13, color:C.dim, margin:'8px 0 4px' }}>Nenhuma refeição ainda.</p>
                <p style={{ fontSize:11, color:'#1e293b' }}>Use Biblioteca, Buscar ou Manual.</p>
              </div>
            ) : (
              <>
                {meals.map(m => (
                  <div key={m.id} style={{ padding:'10px 14px', borderTop:`1px solid ${C.border}`, background:flashId===m.id?'#1e1b4b':'transparent', transition:'background 0.5s', display:'flex', alignItems:'flex-start', gap:8 }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 4px', fontSize:12, fontWeight:600, color:C.text }}>{m.name}</p>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        <MacroTag k="kcal" val={m.kcal} suf=" kcal"/>
                        <MacroTag k="prot" val={m.prot} suf="g P"/>
                        <MacroTag k="carb" val={m.carb} suf="g C"/>
                        <MacroTag k="fat"  val={m.fat}  suf="g G"/>
                      </div>
                    </div>
                    <button onClick={() => saveMeals(meals.filter(x => x.id !== m.id))}
                      style={{ background:'none', border:'none', cursor:'pointer', color:C.dim, fontSize:18, lineHeight:1, padding:'0 2px', flexShrink:0 }}>×</button>
                  </div>
                ))}
                <div style={{ padding:'10px 14px', borderTop:`2px solid ${C.borderLight}`, background:C.surface, display:'flex', gap:12, flexWrap:'wrap' }}>
                  <MacroTag k="kcal" val={Math.round(totals.kcal)} suf=" kcal"/>
                  <MacroTag k="prot" val={Math.round(totals.prot*10)/10} suf="g P"/>
                  <MacroTag k="carb" val={Math.round(totals.carb*10)/10} suf="g C"/>
                  <MacroTag k="fat"  val={Math.round(totals.fat*10)/10}  suf="g G"/>
                </div>
              </>
            )}
          </div>
          <p style={{ textAlign:'center', fontSize:9, color:'#1e293b', marginTop:12 }}>Reseta automaticamente à meia-noite</p>
        </div>
      )}

      {/* ── BIBLIOTECA ── */}
      {tab === 'library' && (
        <div style={{ padding:16 }}>
          <input placeholder="Buscar na biblioteca..." value={libSearch} onChange={e => setLibSearch(e.target.value)} style={{ ...INP, marginBottom:10 }}/>

          <button onClick={() => setShowNewFood(!showNewFood)}
            style={{ width:'100%', padding:10, borderRadius:10, border:`1px dashed ${C.accent}`, background:'transparent', color:C.accent, cursor:'pointer', fontSize:13, fontWeight:700, marginBottom:12 }}>
            {showNewFood ? '✕ Cancelar' : '+ Adicionar alimento à biblioteca'}
          </button>

          {showNewFood && (
            <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:14, marginBottom:14 }}>
              <p style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:1, margin:'0 0 10px' }}>Valores por 100g / 100ml / 1 unidade</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <input placeholder="Nome do alimento" value={nf.name} onChange={e => setNf(f=>({...f,name:e.target.value}))} style={INP}/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <input placeholder="Kcal" type="number" value={nf.kcal} onChange={e => setNf(f=>({...f,kcal:e.target.value}))} style={INP}/>
                  <input placeholder="Proteína (g)" type="number" value={nf.prot} onChange={e => setNf(f=>({...f,prot:e.target.value}))} style={INP}/>
                  <input placeholder="Carb (g)" type="number" value={nf.carb} onChange={e => setNf(f=>({...f,carb:e.target.value}))} style={INP}/>
                  <input placeholder="Gordura (g)" type="number" value={nf.fat} onChange={e => setNf(f=>({...f,fat:e.target.value}))} style={INP}/>
                </div>
                <select value={nf.unit} onChange={e => setNf(f=>({...f,unit:e.target.value as FoodItem['unit']}))} style={{ ...INP, cursor:'pointer' }}>
                  <option value="g">Gramas (g)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="copo">Copo (valores por 1 copo)</option>
                  <option value="un">Unidade</option>
                </select>
                <button onClick={addNewFood} style={{ background:C.accent, border:'none', borderRadius:8, color:'#fff', padding:10, fontWeight:700, cursor:'pointer', fontSize:13 }}>
                  Salvar
                </button>
              </div>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtLib.map(item => {
              const qty = libQtys[item.id] ?? (item.unit==='copo'||item.unit==='un' ? 1 : 100)
              const n = calcNutrients(item, qty)
              const step = item.unit==='copo'||item.unit==='un' ? 1 : 5
              return (
                <div key={item.id} style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div>
                      <p style={{ margin:0, fontSize:13, fontWeight:700 }}>{item.name}</p>
                      <p style={{ margin:'2px 0 0', fontSize:9, color:C.muted }}>por 100{item.unit==='copo'?' (copo)':item.unit==='un'?' un':item.unit}</p>
                    </div>
                    <button onClick={() => { if(window.confirm(`Remover ${item.name}?`)) saveLibrary(library.filter(f=>f.id!==item.id)) }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:C.dim, fontSize:15 }}>🗑️</button>
                  </div>
                  <div style={{ display:'flex', gap:10, marginBottom:10, flexWrap:'wrap' }}>
                    <MacroTag k="kcal" val={n.kcal} suf=" kcal"/>
                    <MacroTag k="prot" val={n.prot} suf="g P"/>
                    <MacroTag k="carb" val={n.carb} suf="g C"/>
                    <MacroTag k="fat"  val={n.fat}  suf="g G"/>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <QtyControl value={qty} step={step} unit={item.unit} onChange={v => setLibQtys(q=>({...q,[item.id]:v}))}/>
                    <button onClick={() => addMeal(item, qty)}
                      style={{ flex:1, padding:'8px 12px', background:C.accent, border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:12, minWidth:90 }}>
                      + Adicionar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── BUSCA ── */}
      {tab === 'search' && (
        <div style={{ padding:16 }}>
          <div style={{ position:'relative', marginBottom:16 }}>
            <input placeholder="Ex: frango grelhado, mucilon, banana..." value={searchQ}
              onChange={e => doSearch(e.target.value)}
              style={{ ...INP, paddingRight:40 }}/>
            {searching && (
              <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>⏳</span>
            )}
          </div>

          {searchResults.length === 0 && !searching && searchQ && (
            <div style={{ textAlign:'center', padding:'32px 0', color:C.dim }}>
              <p style={{ fontSize:20 }}>🔍</p>
              <p style={{ fontSize:13, marginTop:8 }}>Nenhum resultado. Tente outra palavra ou adicione manualmente.</p>
            </div>
          )}

          {!searchQ && (
            <div style={{ textAlign:'center', padding:'40px 0', color:C.dim }}>
              <p style={{ fontSize:32 }}>🔍</p>
              <p style={{ fontSize:13, marginTop:8 }}>Busca em Open Food Facts + USDA</p>
              <p style={{ fontSize:11, marginTop:4, color:'#1e293b' }}>Produtos brasileiros + alimentos in natura</p>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {searchResults.map(item => {
              const qty = searchQtys[item.id] ?? 100
              const n = calcNutrients(item, qty)
              return (
                <div key={item.id} style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:700 }}>{item.name}</p>
                      {item.brand && <p style={{ margin:'2px 0 0', fontSize:10, color:C.muted }}>{item.brand}</p>}
                      <p style={{ margin:'2px 0 0', fontSize:9, color:C.accent }}>📡 {item.source}</p>
                    </div>
                    <button onClick={() => addSearchToLib(item)}
                      title="Salvar na biblioteca" style={{ background:'none', border:'none', cursor:'pointer', fontSize:18 }}>💾</button>
                  </div>
                  <div style={{ display:'flex', gap:10, marginBottom:10, flexWrap:'wrap' }}>
                    <MacroTag k="kcal" val={n.kcal} suf=" kcal"/>
                    <MacroTag k="prot" val={n.prot} suf="g P"/>
                    <MacroTag k="carb" val={n.carb} suf="g C"/>
                    <MacroTag k="fat"  val={n.fat}  suf="g G"/>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <QtyControl value={qty} step={5} unit={item.unit} onChange={v => setSearchQtys(q=>({...q,[item.id]:v}))}/>
                    <button onClick={() => addMeal(item, qty, true)}
                      style={{ flex:1, padding:'8px 12px', background:C.accent, border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:12, minWidth:90 }}>
                      + Adicionar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MANUAL ── */}
      {tab === 'manual' && (
        <div style={{ padding:16 }}>
          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:16 }}>
            <p style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:1, margin:'0 0 14px' }}>Adicionar refeição manualmente</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <input placeholder="Nome (ex: Macarrão com frango)" value={mName} onChange={e => setMName(e.target.value)} style={INP}/>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:C.muted, whiteSpace:'nowrap' }}>Quantidade:</span>
                <QtyControl value={mQty} step={10} unit="g" onChange={setMQty}/>
              </div>
              <p style={{ fontSize:10, color:C.muted, margin:'2px 0 0' }}>Valores por 100g:</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {([['kcal','Kcal',C.kcal],['prot','Proteína (g)',C.prot],['carb','Carb (g)',C.carb],['fat','Gordura (g)',C.fat]] as const).map(([k,label,col]) => {
                  const vals: Record<string,string> = { kcal:mKcal, prot:mProt, carb:mCarb, fat:mFat }
                  const setters: Record<string,(v:string)=>void> = { kcal:setMKcal, prot:setMProt, carb:setMCarb, fat:setMFat }
                  return (
                    <div key={k}>
                      <label style={{ fontSize:9, color:col, textTransform:'uppercase', letterSpacing:1 }}>{label}</label>
                      <input type="number" placeholder="0" value={vals[k]} onChange={e => setters[k](e.target.value)} style={{ ...INP, marginTop:4 }}/>
                    </div>
                  )
                })}
              </div>

              {mName && (
                <div style={{ background:C.bg, borderRadius:8, padding:10, border:`1px solid ${C.border}` }}>
                  <p style={{ margin:'0 0 4px', fontSize:10, color:C.muted }}>Preview · {mName} ({mQty}g)</p>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    <MacroTag k="kcal" val={Math.round((Number(mKcal)||0)*(mQty/100)*10)/10} suf=" kcal"/>
                    <MacroTag k="prot" val={Math.round((Number(mProt)||0)*(mQty/100)*10)/10} suf="g P"/>
                    <MacroTag k="carb" val={Math.round((Number(mCarb)||0)*(mQty/100)*10)/10} suf="g C"/>
                    <MacroTag k="fat"  val={Math.round((Number(mFat)||0)*(mQty/100)*10)/10}  suf="g G"/>
                  </div>
                </div>
              )}

              <button onClick={addManual}
                style={{ background: mName&&mKcal ? 'linear-gradient(135deg,#F97316,#A855F7)' : C.dim, border:'none', borderRadius:10, color:'#fff', padding:12, fontWeight:800, cursor: mName&&mKcal?'pointer':'not-allowed', fontSize:14 }}>
                + Adicionar ao dia
              </button>
              <button onClick={saveManualToLib}
                style={{ width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${C.accent}`, background:'transparent', color:C.accent, cursor:'pointer', fontSize:12, fontWeight:700 }}>
                💾 Salvar na biblioteca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
