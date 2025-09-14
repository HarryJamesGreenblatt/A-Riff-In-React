import React, { useState } from 'react'
// ...existing code...

interface Props {
  open: boolean
  onClose: () => void
  onSave: (phone: string) => Promise<void>
}

const PhoneCollectModal: React.FC<Props> = ({ open, onClose, onSave }) => {
  const [phone, setPhone] = useState('')
  // currentUser not needed here; parent provides onSave with userId

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>We need one more thing</h3>
        <p>Please provide a phone number so we can complete your profile.</p>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onSave(phone)}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default PhoneCollectModal
