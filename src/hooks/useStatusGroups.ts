import { useMemo } from 'react'

type HasStatus<T extends string> = { status: T }

export function useStatusGroups<T extends string, Item extends HasStatus<T> & { party?: { id: string; name?: string }; partyId?: string }>(
  items: Item[],
  statusOrder: T[],
) {
  return useMemo(() => {
    const byParty: Record<string, { partyName: string; byStatus: Record<string, Item[]> }> = {}
    for (const it of items) {
      const pid = it.party?.id || it.partyId || 'unknown'
      const pname = it.party?.name || pid
      if (!byParty[pid]) byParty[pid] = { partyName: pname, byStatus: {} }
      if (!byParty[pid].byStatus[it.status]) byParty[pid].byStatus[it.status] = []
      byParty[pid].byStatus[it.status].push(it)
    }
    const ordered = Object.entries(byParty).map(([pid, group]) => ({
      partyId: pid,
      partyName: group.partyName,
      statuses: statusOrder.map((st) => ({ status: st, items: group.byStatus[st] || [] })).filter((s) => s.items.length > 0),
    }))
    return ordered
  }, [items, statusOrder.join(',')])
}


