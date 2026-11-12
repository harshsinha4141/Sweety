import Button from './Button'
import Modal from './Modal'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={loading ? undefined : onCancel} title={title} description={description} size="sm">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          loading={loading}
          className={danger ? 'bg-red-600! shadow-red-600/25! hover:bg-red-700!' : ''}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
