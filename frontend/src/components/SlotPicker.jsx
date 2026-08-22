import React from 'react';

export default function SlotPicker({
  slots,
  selectedSlotId,
  onSelectSlot,
  loading,
}) {
  const formatSlotTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <p className="text-xs text-gray-500 py-2">Loading available slots...</p>;
  }

  if (!slots || slots.length === 0) {
    return <p className="text-xs text-error py-2">No slots configured for this store.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot._id;
        return (
          <div
            key={slot._id}
            onClick={() => !slot.isFull && onSelectSlot(slot._id)}
            className={`p-3 rounded-xl border transition-all ${
              slot.isFull
                ? 'border-border/60 bg-gray-100/70 opacity-60 cursor-not-allowed'
                : isSelected
                ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 cursor-pointer'
                : 'border-border bg-bg/50 hover:border-primary/50 cursor-pointer'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-text">
                {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
              </span>
              {slot.isFull ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error">
                  Full
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {slot.availableSlots} left
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Bookings: {slot.bookedCount}/{slot.maxOrders}
            </div>
          </div>
        );
      })}
    </div>
  );
}
