import React from 'react';

export default function OrderStatusTimeline({ status, fulfillmentType, history = [] }) {
  const isPickup = fulfillmentType === 'pickup';
  const isCancelled = status === 'cancelled';

  const steps = [
    { key: 'placed', label: 'Order Placed', icon: '📝' },
    { key: 'confirmed', label: 'Confirmed', icon: '✓' },
    { key: 'preparing', label: 'Preparing Items', icon: '📦' },
    {
      key: isPickup ? 'ready_for_pickup' : 'out_for_delivery',
      label: isPickup ? 'Ready for Pickup' : 'Out for Delivery',
      icon: isPickup ? '🏪' : '🚚',
    },
    { key: 'completed', label: 'Completed', icon: '🎉' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === status);

  if (isCancelled) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-2xl p-4 sm:p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-error/20 text-error flex items-center justify-center mx-auto text-xl font-bold mb-2">
          ✕
        </div>
        <h3 className="font-bold text-error text-base">Order Cancelled</h3>
        <p className="text-xs text-gray-500 mt-1">
          This order was cancelled. Any inventory allocations have been released.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-4 sm:p-6 shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
        Order Status Progress
      </h3>

      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        {/* Connecting progress bar for sm+ screens */}
        <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-border -z-0">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {steps.map((step, idx) => {
          const isDone = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.key}
              className="flex sm:flex-col items-center gap-3 sm:gap-2 relative z-10 w-full sm:w-auto"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-xs ${
                  isCurrent
                    ? 'bg-primary text-white ring-4 ring-primary/20 scale-110'
                    : isDone
                    ? 'bg-primary text-white'
                    : 'bg-bg text-gray-500 border border-border'
                }`}
              >
                {isDone ? step.icon : idx + 1}
              </div>

              <div className="text-left sm:text-center">
                <div
                  className={`text-xs font-semibold ${
                    isCurrent
                      ? 'text-primary font-bold'
                      : isDone
                      ? 'text-text'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </div>
                {isCurrent && (
                  <span className="inline-block sm:block text-[10px] text-primary font-medium mt-0.5 animate-pulse">
                    Current Stage
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
