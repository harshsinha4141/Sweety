import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import Button from '../ui/Button'

// "Hard reset": clears the server's cached reports, then reloads them straight from the database.
// onReset() calls the API (returns { cache, cleared, deleted_keys }); onDone() refetches the page data.
export default function HardResetButton({ onReset, onDone }) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    try {
      const result = await onReset()
      if (result?.cache === 'enabled') toast.success('Report cache cleared — reports reloaded from the database.')
      else if (result?.cache === 'unavailable') toast.warn("Cache server is unreachable — reports are loading live from the database.")
      else toast.info('Caching is off — reports already come live from the database.')
      onDone?.()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      loading={busy}
      title="Clear cached reports and reload them from the database"
    >
      {!busy && <RotateCcw className="size-4" aria-hidden="true" />} Hard reset
    </Button>
  )
}
