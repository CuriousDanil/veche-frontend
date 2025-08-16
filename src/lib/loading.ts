type Listener = (loading: boolean) => void

let counter = 0
const listeners = new Set<Listener>()

export function startGlobalLoading() {
  counter += 1
  if (counter === 1) notify(true)
}

export function stopGlobalLoading() {
  if (counter > 0) counter -= 1
  if (counter === 0) notify(false)
}

export function subscribeLoading(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(loading: boolean) {
  for (const l of listeners) l(loading)
}


