'use client';

import { Check, X, Ban, AlertTriangle, ShieldX } from 'lucide-react';
import type { BookingStatus } from '@/lib/api/types';
import {
  BOOKING_MAIN_STEPS,
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABEL,
  BOOKING_STEP_LABEL,
  currentStepIndex,
  isBranchState,
} from '@/lib/bookings/status';

interface BookingTimelineProps {
  status: BookingStatus;
  className?: string;
}

export function BookingTimeline({ status, className = '' }: BookingTimelineProps) {
  const currentIdx = currentStepIndex(status);
  const branch = isBranchState(status);
  const branchColors = branch ? BOOKING_STATUS_COLORS[status] : null;

  const BranchIcon =
    status === 'REJECTED'
      ? X
      : status === 'CANCELLED'
        ? Ban
        : status === 'DISPUTED'
          ? AlertTriangle
          : status === 'DELIVERY_REJECTED'
            ? X
            : ShieldX;

  return (
    <div className={`w-full ${className}`}>
      {/* Steps row (horizontal scroll on mobile) */}
      <ol className="flex items-start gap-0 overflow-x-auto pb-2 -mx-2 px-2">
        {BOOKING_MAIN_STEPS.map((step, i) => {
          const stepColors = BOOKING_STATUS_COLORS[step];
          const isComplete = i < currentIdx || (i === currentIdx && status === 'COMPLETED');
          const isCurrent = i === currentIdx && status !== 'COMPLETED';
          const isFuture = i > currentIdx;

          // If branched at this step (DISPUTED happened at DELIVERED), mark current as branch color.
          const branchedHere = branch && i === currentIdx;

          let circleStyle: React.CSSProperties;
          let labelClass = '';
          if (branchedHere && branchColors) {
            circleStyle = { background: branchColors.bg, color: branchColors.text };
            labelClass = 'font-bold';
          } else if (isComplete) {
            circleStyle = { background: stepColors.bg, color: stepColors.text };
            labelClass = 'font-bold text-ink';
          } else if (isCurrent) {
            circleStyle = { background: stepColors.bg, color: stepColors.text };
            labelClass = 'font-bold text-ink';
          } else {
            circleStyle = { background: '#e5e7eb', color: '#9ca3af' };
            labelClass = 'text-mute';
          }

          return (
            <li
              key={step}
              className="flex-1 min-w-[88px] flex flex-col items-center relative"
            >
              {/* Connector line (drawn on the right of this step except for last) */}
              {i < BOOKING_MAIN_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-[18px] left-1/2 w-full h-[3px]"
                  style={{
                    background:
                      i < currentIdx
                        ? BOOKING_STATUS_COLORS[BOOKING_MAIN_STEPS[i + 1] as keyof typeof BOOKING_STATUS_COLORS]
                            .bg
                        : '#e5e7eb',
                  }}
                />
              )}

              <span
                className={`relative z-10 grid place-items-center w-9 h-9 rounded-full text-sm font-bold ring-4 ring-canvas ${
                  isCurrent && !branchedHere ? 'animate-pulse' : ''
                }`}
                style={circleStyle}
              >
                {branchedHere ? (
                  <BranchIcon className="w-4 h-4" />
                ) : isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </span>

              <span className={`mt-2 text-[11px] text-center px-1 ${labelClass}`}>
                {branchedHere ? BOOKING_STATUS_LABEL[status] : BOOKING_STEP_LABEL[step]}
              </span>
            </li>
          );
        })}
      </ol>

      {/* If branched before reaching the timeline (REJECTED / CANCELLED / CANCELLED_BY_ADMIN
          from PENDING), show a separate banner. */}
      {branch && currentIdx === -1 && branchColors && (
        <div
          className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: branchColors.soft,
            border: `1px solid ${branchColors.border}`,
          }}
        >
          <span
            className="grid place-items-center w-9 h-9 rounded-full shrink-0"
            style={{ background: branchColors.bg, color: branchColors.text }}
          >
            <BranchIcon className="w-4 h-4" />
          </span>
          <div className="text-sm">
            <p className="font-bold text-ink">{BOOKING_STATUS_LABEL[status]}</p>
            <p className="text-mute">Đơn đã kết thúc ở trạng thái này.</p>
          </div>
        </div>
      )}
    </div>
  );
}
