import React, { useState, useEffect, useRef, useId } from 'react';
import { ActionType, Animal } from '../types';

// this key is public by design, it can only deliver a message to the inbox that created it, and it is the single exception to this project's rule that credentials live server-side, because Web3Forms' own documentation says to call it from the client and server-side use needs a paid plan.
const WEB3FORMS_ACCESS_KEY = '001b9168-1542-4d44-acef-cce2d31d1663';

const ALL_SLOTS = [
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
];

interface SingaporeTiming {
  todayStr: string;
  tomorrowStr: string;
  validTodaySlots: string[];
  hasSlotsToday: boolean;
  earliestDate: string;
}

function getSingaporeTiming(): SingaporeTiming {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);

  const todayStr = `${map.year}-${map.month}-${map.day}`;

  // Tomorrow in Singapore
  const sgTomorrow = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  sgTomorrow.setUTCDate(sgTomorrow.getUTCDate() + 1);
  const tomYear = sgTomorrow.getUTCFullYear();
  const tomMonth = String(sgTomorrow.getUTCMonth() + 1).padStart(2, '0');
  const tomDay = String(sgTomorrow.getUTCDate()).padStart(2, '0');
  const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

  const currentMinutes = hour * 60 + minute;
  // For TODAY only, hide any slot less than 2 hours from now
  const minRequiredMinutesToday = currentMinutes + 120;

  const validTodaySlots = ALL_SLOTS.filter((slot) => {
    const [h, m] = slot.split(':').map(Number);
    return h * 60 + m >= minRequiredMinutesToday;
  });

  const hasSlotsToday = validTodaySlots.length > 0;
  const earliestDate = hasSlotsToday ? todayStr : tomorrowStr;

  return {
    todayStr,
    tomorrowStr,
    validTodaySlots,
    hasSlotsToday,
    earliestDate,
  };
}

interface EnquiryModalProps {
  isOpen: boolean;
  actionType: ActionType;
  initialAnimal: Animal | null;
  allAnimals: Animal[];
  onClose: () => void;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  actionType,
  initialAnimal,
  allAnimals,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const nameInputId = useId();
  const emailInputId = useId();
  const phoneInputId = useId();
  const rescueSelectId = useId();
  const dateInputId = useId();
  const slotSelectId = useId();
  const messageInputId = useId();

  const [timing, setTiming] = useState<SingaporeTiming>(() => getSingaporeTiming());

  const [selectedRescue, setSelectedRescue] = useState<string>(() =>
    initialAnimal ? initialAnimal.name : allAnimals[0]?.name || 'Kopi'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [submittedData, setSubmittedData] = useState<{
    rescue: string;
    name: string;
    email: string;
    date?: string;
    slot?: string;
  } | null>(null);

  // Recalculate timing and reset form values whenever modal opens or initialAnimal changes
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;

      const currentTiming = getSingaporeTiming();
      setTiming(currentTiming);

      const defaultRescue = initialAnimal ? initialAnimal.name : allAnimals[0]?.name || 'Kopi';
      setSelectedRescue(defaultRescue);

      if (actionType === 'visit') {
        const initialDate = currentTiming.earliestDate;
        setDate(initialDate);
        if (initialDate === currentTiming.todayStr) {
          setSlot(currentTiming.validTodaySlots[0] || '');
        } else {
          setSlot(ALL_SLOTS[0]);
        }
      }

      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setErrors({});
      setSubmitError(null);
      setIsSuccess(false);
      setSubmittedData(null);
    }
  }, [isOpen, initialAnimal, actionType, allAnimals]);

  // Accessibility: Focus trap, Esc to close, lock body scroll, restore focus
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first focusable control inside modal
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ) as HTMLElement[];
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Rescue options: 8 example rescues + "Not sure yet"
  const rescueOptions = [...allAnimals.map((a) => a.name), 'Not sure yet'];

  // Current available slots based on selected date
  const availableSlots = date === timing.todayStr ? timing.validTodaySlots : ALL_SLOTS;

  // Title: "Adoption enquiry — {rescue}" or "Book a visit — {rescue}"
  const dialogTitle =
    actionType === 'adopt'
      ? `Adoption enquiry — ${selectedRescue}`
      : `Book a visit — ${selectedRescue}`;

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    // Clear date error
    if (errors.date) {
      setErrors((prev) => ({ ...prev, date: '' }));
    }
    // If today is chosen, check if current slot is still valid
    if (newDate === timing.todayStr) {
      if (!timing.validTodaySlots.includes(slot)) {
        setSlot(timing.validTodaySlots[0] || '');
      }
    } else {
      if (!slot) {
        setSlot(ALL_SLOTS[0]);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (actionType === 'visit') {
      if (!date) {
        newErrors.date = 'Please select a date.';
      } else if (date < timing.earliestDate) {
        newErrors.date = 'Please select an available upcoming date.';
      }

      if (!slot) {
        newErrors.slot = 'Please select a time slot.';
      } else if (date === timing.todayStr) {
        // Refresh timing to ensure slot is still in future
        const latestTiming = getSingaporeTiming();
        if (!latestTiming.validTodaySlots.includes(slot)) {
          newErrors.slot = 'This slot is less than 2 hours from now. Please choose another slot.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const subject =
      actionType === 'visit'
        ? `Visit booking — ${name.trim()} — ${selectedRescue} — ${date} ${slot}`
        : `Adoption enquiry — ${name.trim()} — ${selectedRescue}`;

    const payload: Record<string, unknown> = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject,
      replyto: email.trim(),
      botcheck: '',
      name: name.trim(),
      email: email.trim(),
      rescue: selectedRescue,
      message: message.trim(),
    };

    if (phone.trim()) {
      payload.phone = phone.trim();
    }

    if (actionType === 'visit') {
      payload.date = date;
      payload.slot = slot;
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && (result.success || result.message === 'success')) {
        setSubmittedData({
          rescue: selectedRescue,
          name: name.trim(),
          email: email.trim(),
          ...(actionType === 'visit' ? { date, slot } : {}),
        });
        setIsSuccess(true);
      } else {
        setSubmitError('We could not send that just now. Please try again in a moment.');
      }
    } catch {
      setSubmitError('We could not send that just now. Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-warmgray-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title-id"
        className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E8E1DA] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#F2EDE8] bg-[#FAF7F2]">
          <h2
            id="dialog-title-id"
            className="text-base sm:text-lg font-black text-warmgray-900 tracking-tight"
          >
            {dialogTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-warmgray-500 hover:text-warmgray-900 hover:bg-[#E8E1DA]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta-500"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {isSuccess && submittedData ? (
            /* Success confirmation screen */
            <div className="space-y-5">
              <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 sm:p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">
                  Request Summary
                </div>
                <div className="space-y-1.5 text-xs sm:text-sm text-warmgray-800">
                  <p>
                    <span className="text-warmgray-500">Rescue:</span>{' '}
                    <strong className="font-bold text-warmgray-900">{submittedData.rescue}</strong>
                  </p>
                  {submittedData.date && submittedData.slot && (
                    <>
                      <p>
                        <span className="text-warmgray-500">Visit Date:</span>{' '}
                        <strong className="font-bold text-warmgray-900">{submittedData.date}</strong>
                      </p>
                      <p>
                        <span className="text-warmgray-500">Time Slot:</span>{' '}
                        <strong className="font-bold text-warmgray-900">{submittedData.slot}</strong>
                      </p>
                    </>
                  )}
                  <p>
                    <span className="text-warmgray-500">Your Name:</span>{' '}
                    <strong className="font-bold text-warmgray-900">{submittedData.name}</strong>
                  </p>
                  <p>
                    <span className="text-warmgray-500">Reply To:</span>{' '}
                    <strong className="font-bold text-warmgray-900">{submittedData.email}</strong>
                  </p>
                </div>
              </div>

              {/* Exact required wording */}
              <div className="space-y-2.5 text-xs sm:text-sm text-warmgray-700 leading-relaxed bg-[#FAF7F2] border border-[#E8E1DA] rounded-2xl p-4 sm:p-5">
                <p className="font-medium text-warmgray-900">
                  Thank you. Your request has reached the shelter&rsquo;s inbox. Someone will reply to{' '}
                  <span className="font-semibold text-warmgray-900">{submittedData.email}</span> — we aim to answer within two working days.
                </p>
                <p className="text-amber-900 font-semibold">
                  You will NOT receive an automatic confirmation email.
                </p>
                <p className="text-xs text-warmgray-600 border-t border-[#E8E1DA] pt-2 mt-2">
                  This is a student project for MGMT 6110. Paws &amp; Home SG is not a real organisation and no actual appointment has been made.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Form view */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Hidden honeypot field for Web3Forms */}
              <input
                type="checkbox"
                name="botcheck"
                className="hidden"
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Which Rescue? Dropdown */}
              <div>
                <label
                  htmlFor={rescueSelectId}
                  className="block text-xs font-bold uppercase tracking-wider text-warmgray-700 mb-1"
                >
                  Which rescue?
                </label>
                <select
                  id={rescueSelectId}
                  value={selectedRescue}
                  onChange={(e) => setSelectedRescue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBC0] bg-white text-sm text-warmgray-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                >
                  {rescueOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor={nameInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-warmgray-700 mb-1"
                >
                  Name <span className="text-terracotta-600 font-bold">*</span>
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${
                    errors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#D6CBC0]'
                  } bg-white text-sm text-warmgray-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500`}
                  placeholder="e.g. Rachel Tan"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor={emailInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-warmgray-700 mb-1"
                >
                  Email <span className="text-terracotta-600 font-bold">*</span>
                </label>
                <input
                  id={emailInputId}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${
                    errors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#D6CBC0]'
                  } bg-white text-sm text-warmgray-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500`}
                  placeholder="rachel@example.com"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Phone (Optional) */}
              <div>
                <label
                  htmlFor={phoneInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-warmgray-700 mb-1"
                >
                  Phone <span className="text-xs font-normal text-warmgray-500 normal-case">(optional)</span>
                </label>
                <input
                  id={phoneInputId}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBC0] bg-white text-sm text-warmgray-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  placeholder="+65 9123 4567"
                />
              </div>

              {/* Visit specific fields: Date & Time Slot */}
              {actionType === 'visit' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Date */}
                  <div>
                    <label
                      htmlFor={dateInputId}
                      className="block text-xs font-bold uppercase tracking-wider text-warmgray-700 mb-1"
                    >
                      Visit Date <span className="text-terracotta-600 font-bold">*</span>
                    </label>
                    <input
                      id={dateInputId}
                      type="date"
                      min={timing.earliestDate}
                      value={date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        errors.date ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#D6CBC0]'
                      } bg-white text-sm text-warmgray-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500`}
                      required
                    />
                    {errors.date && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{errors.date}</p>
                    )}
                    {!timing.hasSlotsToday && (
                      <p className="mt-1 text-[11px] text-amber-900 leading-tight">
                        No slots remain today (requires 2 hours notice before 19:30). Earliest booking is tomorrow.
                      </p>
                    )}
                  </div>

                  {/* Time Slot */}
                  <div>
                    <label
                      htmlFor={slotSelectId}
                      className="block text-xs font-bold uppercase tracking-wider text-warmgray-700 mb-1"
                    >
                      Time Slot <span className="text-terracotta-600 font-bold">*</span>
                    </label>
                    <select
                      id={slotSelectId}
                      value={slot}
                      onChange={(e) => {
                        setSlot(e.target.value);
                        if (errors.slot) setErrors((prev) => ({ ...prev, slot: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        errors.slot ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#D6CBC0]'
                      } bg-white text-sm text-warmgray-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500`}
                      required
                    >
                      {availableSlots.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.slot && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{errors.slot}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Message Box */}
              <div>
                <label
                  htmlFor={messageInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-warmgray-700 mb-1"
                >
                  Message
                </label>
                <textarea
                  id={messageInputId}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBC0] bg-white text-sm text-warmgray-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500 resize-none"
                  placeholder={
                    actionType === 'adopt'
                      ? "Tell us a bit about your home and experience with strays..."
                      : "Any questions or notes for the shelter team ahead of your visit..."
                  }
                ></textarea>
              </div>

              {/* Failure Error Message */}
              {submitError && (
                <p className="text-xs sm:text-sm font-semibold text-rose-600 text-center py-1">
                  {submitError}
                </p>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 disabled:bg-warmgray-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Sending request...</span>
                    </>
                  ) : (
                    <span>{actionType === 'adopt' ? 'Submit Adoption Enquiry' : 'Book Visit'}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
