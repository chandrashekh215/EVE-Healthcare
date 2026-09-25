import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { createBookingApi } from '../../api/bookings';
import { Calendar, Clock, IndianRupee, Building2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const bookingSchema = z.object({
  appointmentDatetime: z
    .string()
    .min(1, 'Please select an appointment date and time')
    .refine((val) => new Date(val) > new Date(), {
      message: 'Appointment time must be in the future',
    }),
});

export const BookingModal = ({ isOpen, onClose, test, centreName }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute minimum datetime string for HTML datetime-local input (current time + 1 hour)
  const getMinDatetime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = async (data) => {
    if (!test) return;

    setIsSubmitting(true);
    try {
      // Format to ISO 8601 string
      const isoDatetime = new Date(data.appointmentDatetime).toISOString();
      const response = await createBookingApi({
        testId: test.id,
        appointmentDatetime: isoDatetime,
      });

      toast.success('Appointment booked successfully!');
      reset();
      onClose();
      navigate(`/bookings/${response.data.id}`);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!test) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Diagnostic Appointment">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Test Summary Card */}
        <div className="bg-brand-50/70 border border-brand-100 rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Selected Test</span>
              <h4 className="text-base font-bold text-slate-900">{test.name}</h4>
            </div>
            <span className="text-lg font-extrabold text-brand-700 bg-white px-3 py-1 rounded-lg border border-brand-200 shadow-xs">
              ₹{test.price?.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 pt-1 border-t border-brand-100">
            <Building2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate">{centreName || test.centre?.name || 'Diagnostic Centre'}</span>
          </div>
        </div>

        {/* Appointment Datetime Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Appointment Date & Time <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              min={getMinDatetime()}
              {...register('appointmentDatetime')}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 transition-colors ${
                errors.appointmentDatetime
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-brand-200 focus:border-brand-500'
              }`}
            />
          </div>
          {errors.appointmentDatetime && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.appointmentDatetime.message}</span>
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            Past appointment dates are automatically disabled. Price is locked at booking creation.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Confirm & Book Appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
