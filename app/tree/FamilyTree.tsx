'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Person } from '@/lib/types'

// ── Layout constants ────────────────────────────────────────────────────────
const CW  = 96    // card width
const CH  = 120   // card height
const CG  = 24    // gap between spouses
const SG  = 36    // gap between siblings (same family)
const FG  = 64    // gap between separate families in the same row
const GS  = 220   // generation step (top of row to top of next row)
const JO  = 30    // join offset: pixels below card bottom where T-junction forms
const PAD = 72    // canvas padding

// ── Types ───────────────────────────────────────────────────────────────────
interface LayoutNode {
  person: Person
  cx: number          // horizontal center of this card
  y:  number          // top of this card
  gen: number
  spouseId:       string | null
  isRightSpouse:  boolean       // true = the "right" member of a couple (don't double-draw line)
}

interface CoupleBar { x1: number; x2: number; y: number }

interface TJunction {
  parentCx:     number   // center x of the join point (midpoint of couple or single parent)
  parentBottom: number   // bottom y of parent cards
  childCxs:     number[] // center x of each child
  childTop:     number   // top y of child cards
}

// ── Core layout ─────────────────────────────────────────────────────────────
function buildLayout(people: Person[]): {
  nodes: LayoutNode[]
  coupleBars: CoupleBar[]
  junctions: TJunction[]
  hasRelationships: boolean
} {
  if (!people.length) return { nodes: [], coupleBars: [], junctions: [], hasRelationships: false }

  const byId = new Map(people.map(p => [p.id, p]))

  // ── Children map + parent tracking ──
  const childrenOf = new Map<string, string[]>()
  for (const p of people) childrenOf.set(p.id, [])
  const hasParents = new Set<string>()

  for (const p of people) {
    const p1 = p.parent1_id && byId.has(p.parent1_id) ? p.parent1_id : null
    const p2 = p.parent2_id && byId.has(p.parent2_id) ? p.parent2_id : null
    if (p1) { childrenOf.get(p1)!.push(p.id); hasParents.add(p.id) }
    if (p2) { childrenOf.get(p2)!.push(p.id); hasParents.add(p.id) }
  }

  // ── Couple detection: two people who share at least one child ──
  const coupleOf = new Map<string, string>()
  for (const p of people) {
    const p1 = p.parent1_id && byId.has(p.parent1_id) ? p.parent1_id : null
    const p2 = p.parent2_id && byId.has(p.parent2_id) ? p.parent2_id : null
    if (p1 && p2 && !coupleOf.has(p1)) {
      coupleOf.set(p1, p2)
      coupleOf.set(p2, p1)
    }
  }

  // ── Generation depth (max parent gen + 1, cycle-safe) ──
  const genOf = new Map<string, number>()
  function getGen(id: string, vis: Set<string>): number {
    if (genOf.has(id)) return genOf.get(id)!
    if (vis.has(id)) return 0
    vis.add(id)
    const p = byId.get(id)!
    let max = -1
    for (const pid of [p.parent1_id, p.parent2_id])
      if (pid && byId.has(pid)) max = Math.max(max, getGen(pid, new Set(vis)))
    const g = max + 1
    genOf.set(id, g)
    return g
  }
  for (const p of people) getGen(p.id, new Set())

  // ── Group by generation ──
  const byGen = new Map<number, string[]>()
  for (const p of people) {
    const g = genOf.get(p.id) ?? 0
    if (!byGen.has(g)) byGen.set(g, [])
    byGen.get(g)!.push(p.id)
  }
  const sortedGens = [...byGen.keys()].sort((a, b) => a - b)

  // ── Assign positions (top-down) ──
  const cxOf = new Map<string, number>()
  const yOf  = new Map<string, number>()
  const isRightSpouse = new Set<string>()

  for (const gen of sortedGens) {
    const ids = byGen.get(gen)!
    const y = gen * GS

    // Sort by average parent cx to minimise edge crossings
    ids.sort((a, b) => {
      const avgPCx = (id: string) => {
        const p = byId.get(id)!
        const xs: number[] = []
        if (p.parent1_id && cxOf.has(p.parent1_id)) xs.push(cxOf.get(p.parent1_id)!)
        if (p.parent2_id && cxOf.has(p.parent2_id)) xs.push(cxOf.get(p.parent2_id)!)
        return xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0
      }
      return avgPCx(a) - avgPCx(b)
    })

    // Build ordered slots (couple = two adjacent cards)
    const slots: { ids: string[]; w: number }[] = []
    const placed = new Set<string>()

    for (const id of ids) {
      if (placed.has(id)) continue
      const spouse = coupleOf.get(id)
      const spouseHere = spouse && byGen.get(gen)?.includes(spouse) && !placed.has(spouse)
      if (spouseHere) {
        slots.push({ ids: [id, spouse!], w: CW * 2 + CG })
        isRightSpouse.add(spouse!)
        placed.add(id); placed.add(spouse!)
      } else {
        slots.push({ ids: [id], w: CW })
        placed.add(id)
      }
    }

    // Gap between slots depends on whether adjacent slots share parents
    const totalW = slots.reduce((s, sl) => s + sl.w, 0) + FG * (slots.length - 1)
    let x = -totalW / 2

    for (const slot of slots) {
      cxOf.set(slot.ids[0], x + CW / 2)
      yOf.set(slot.ids[0], y)
      if (slot.ids[1]) {
        cxOf.set(slot.ids[1], x + CW + CG + CW / 2)
        yOf.set(slot.ids[1], y)
      }
      x += slot.w + FG
    }
  }

  // ── Bottom-up centering: reposition each parent couple over their children ──
  for (const gen of [...sortedGens].reverse()) {
    const ids = byGen.get(gen)!

    // Process only the "left" person in each couple (or singles)
    const leaders = ids.filter(id => !isRightSpouse.has(id))

    for (const id of leaders) {
      const spouse = coupleOf.get(id) ?? null
      const myChildren = new Set<string>()
      childrenOf.get(id)?.forEach(c => myChildren.add(c))
      if (spouse) childrenOf.get(spouse)?.forEach(c => myChildren.add(c))
      if (!myChildren.size) continue

      const childCxs = [...myChildren].filter(c => cxOf.has(c)).map(c => cxOf.get(c)!)
      if (!childCxs.length) continue

      const childCenter = (Math.min(...childCxs) + Math.max(...childCxs)) / 2
      const coupleCenter = spouse ? (cxOf.get(id)! + cxOf.get(spouse)!) / 2 : cxOf.get(id)!
      const delta = childCenter - coupleCenter

      cxOf.set(id, cxOf.get(id)! + delta)
      if (spouse) cxOf.set(spouse, cxOf.get(spouse)! + delta)
    }

    // Resolve overlaps left-to-right
    const sorted = leaders.sort((a, b) => (cxOf.get(a) ?? 0) - (cxOf.get(b) ?? 0))
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const prevSpouse = coupleOf.get(prev)
      const prevRightEdge = prevSpouse ? cxOf.get(prevSpouse)! + CW / 2 : cxOf.get(prev)! + CW / 2
      const currLeftEdge = cxOf.get(curr)! - CW / 2
      const minDist = SG
      if (currLeftEdge < prevRightEdge + minDist) {
        const shift = prevRightEdge + minDist - currLeftEdge
        cxOf.set(curr, cxOf.get(curr)! + shift)
        const currSpouse = coupleOf.get(curr)
        if (currSpouse) cxOf.set(currSpouse, cxOf.get(currSpouse)! + shift)
      }
    }
  }

  // ── Build node list ──
  const nodes: LayoutNode[] = people.map(p => ({
    person: p,
    cx: cxOf.get(p.id) ?? 0,
    y:  yOf.get(p.id)  ?? 0,
    gen: genOf.get(p.id) ?? 0,
    spouseId: coupleOf.get(p.id) ?? null,
    isRightSpouse: isRightSpouse.has(p.id),
  }))
  const nodeMap = new Map(nodes.map(n => [n.person.id, n]))

  // ── Couple bars ──
  const coupleBars: CoupleBar[] = []
  const seenCouples = new Set<string>()
  for (const n of nodes) {
    if (!n.spouseId || n.isRightSpouse) continue
    const key = [n.person.id, n.spouseId].sort().join(':')
    if (seenCouples.has(key)) continue
    seenCouples.add(key)
    const spouse = nodeMap.get(n.spouseId)
    if (spouse) {
      coupleBars.push({ x1: n.cx + CW / 2, x2: spouse.cx - CW / 2, y: n.y + CH / 2 })
    }
  }

  // ── T-junctions (one per parent-pair → children group) ──
  const junctionMap = new Map<string, TJunction>()
  for (const p of people) {
    const p1node = p.parent1_id ? nodeMap.get(p.parent1_id) : null
    const p2node = p.parent2_id ? nodeMap.get(p.parent2_id) : null
    if (!p1node && !p2node) continue

    const child = nodeMap.get(p.id)!
    const key = `${p.parent1_id ?? ''}|${p.parent2_id ?? ''}`
    const parentCx = p1node && p2node
      ? (p1node.cx + p2node.cx) / 2
      : (p1node ?? p2node)!.cx
    // For couples: start the drop from the couple bar level (CH/2).
    // For single parents: start from the bottom of the card (CH).
    const parentBottom = (p1node ?? p2node)!.y + (p1node && p2node ? CH / 2 : CH)

    if (!junctionMap.has(key)) {
      junctionMap.set(key, { parentCx, parentBottom, childCxs: [], childTop: child.y })
    }
    junctionMap.get(key)!.childCxs.push(child.cx)
  }

  return {
    nodes,
    coupleBars,
    junctions: [...junctionMap.values()],
    hasRelationships: hasParents.size > 0,
  }
}

// ── SVG path for a T-junction ────────────────────────────────────────────────
function junctionPath(j: TJunction, ox: number, oy: number): string {
  const px = j.parentCx + ox
  const pb = j.parentBottom + oy
  const ct = j.childTop + oy
  const jY = pb + JO
  const parts: string[] = []

  if (j.childCxs.length === 1) {
    // Single child — straight vertical line
    const cx = j.childCxs[0] + ox
    parts.push(`M ${px} ${pb} L ${px} ${jY} L ${cx} ${jY} L ${cx} ${ct}`)
  } else {
    // Multiple children — T-junction
    const left  = Math.min(...j.childCxs) + ox
    const right = Math.max(...j.childCxs) + ox
    // Drop from parent to join level
    parts.push(`M ${px} ${pb} L ${px} ${jY}`)
    // Horizontal bar
    parts.push(`M ${left} ${jY} H ${right}`)
    // Vertical drops to each child
    for (const ccx of j.childCxs) {
      const cx = ccx + ox
      parts.push(`M ${cx} ${jY} L ${cx} ${ct}`)
    }
  }

  return parts.join(' ')
}

// ── Component ────────────────────────────────────────────────────────────────
export default function FamilyTree({ people }: { people: Person[] }) {
  const { nodes, coupleBars, junctions, hasRelationships } = useMemo(
    () => buildLayout(people),
    [people]
  )

  if (people.length === 0) {
    return (
      <div className="text-center py-28 text-slate-400">
        <p className="text-lg mb-2">No family members yet</p>
        <Link href="/people/new" className="text-amber-600 hover:text-amber-700 text-sm underline">
          Add the first member
        </Link>
      </div>
    )
  }

  const minX = Math.min(...nodes.map(n => n.cx - CW / 2))
  const maxX = Math.max(...nodes.map(n => n.cx + CW / 2))
  const minY = Math.min(...nodes.map(n => n.y))
  const maxY = Math.max(...nodes.map(n => n.y + CH))

  const ox = -minX + PAD
  const oy = -minY + PAD
  const W  = maxX - minX + PAD * 2
  const H  = maxY - minY + PAD * 2

  return (
    <div>
      {!hasRelationships && people.length > 1 && (
        <div className="px-6 pt-5">
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            No parent links set yet — edit any family member and assign their parents to build the tree.
          </p>
        </div>
      )}

      <div className="overflow-auto" style={{ maxHeight: '78vh' }}>
        <div style={{ position: 'relative', width: W, height: H, minWidth: W }}>
          <svg
            width={W}
            height={H}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {/* Couple connector bars */}
            {coupleBars.map((bar, i) => (
              <line
                key={`cb-${i}`}
                x1={bar.x1 + ox} y1={bar.y + oy}
                x2={bar.x2 + ox} y2={bar.y + oy}
                stroke="#fcd34d"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            ))}

            {/* Parent → children T-junction paths */}
            {junctions.map((j, i) => (
              <path
                key={`tj-${i}`}
                d={junctionPath(j, ox, oy)}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          {nodes.map(n => (
            <PersonCard key={n.person.id} node={n} ox={ox} oy={oy} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Person card ───────────────────────────────────────────────────────────────
function PersonCard({ node, ox, oy }: { node: LayoutNode; ox: number; oy: number }) {
  const { person } = node
  const initials = person.name
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Link
      href={`/people/${person.id}`}
      style={{
        position: 'absolute',
        left: node.cx - CW / 2 + ox,
        top: node.y + oy,
        width: CW,
        height: CH,
        textDecoration: 'none',
      }}
    >
      <div
        className="w-full h-full bg-white rounded-2xl border border-slate-100 shadow-sm
                   hover:shadow-md hover:-translate-y-0.5 transition-all
                   flex flex-col items-center justify-start gap-2 pt-3 pb-2 px-1 text-center"
      >
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center flex-shrink-0 ring-2 ring-amber-200">
          {person.avatar_url ? (
            <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-base font-bold text-amber-600">{initials}</span>
          )}
        </div>

        {/* Name + relationship */}
        <div className="w-full px-1">
          <p className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">
            {person.name}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{person.relationship}</p>
        </div>
      </div>
    </Link>
  )
}
