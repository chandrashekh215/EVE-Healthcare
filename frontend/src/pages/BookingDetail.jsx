import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { getBookingByIdApi, cancelBookingApi } from '../api/bookings';
import { processPaymentApi } from '../api/payments';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  CalendarCheck,
  Clock,
  Building2,
  IndianRupee,
  ArrowLeft,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Ban,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BookingDetail = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Payment processing modal / state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // Cancellation modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBooking = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await getBookingByIdApi(id);
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking detail:', error);
      if (!silent) toast.error(error.response?.data?.error?.message || 'Booking not found');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  // Auto-polling for status updates if booking is PENDING
  useEffect(() => {
    let interval;
    if (booking && booking.status === 'PENDING') {
      interval = setInterval(() => {
        fetchBooking(true);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [booking?.status]);

  const handleOpenPayModal = () => {
    setPaymentResult(null);
    setSimulateFailure(false); // Reset to unchecked (SUCCESS by default)
    setIsPayModalOpen(true);
  };

  const handlePayNow = async () => {
    setIsProcessingPayment(true);
    setPaymentResult(null);

    try {
      // Simulate gateway delay (1.2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const response = await processPaymentApi({
        bookingId: id,
        simulateFailure,
      });

      const { payment, booking: updatedBooking } = response.data;
      setBooking(updatedBooking);

      if (payment.status === 'SUCCESS') {
        setPaymentResult({ success: true, message: 'Payment confirmed successfully!' });
        // Trigger celebratory confetti effect
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success('Payment successful! Booking confirmed.');
      } else {
        setPaymentResult({ success: false, message: 'Payment failed at gateway.' });
        toast.error('Payment failed. Booking status set to FAILED.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || 'Payment simulation failed.';

      if (status === 409) {
        toast.error('Payment Conflict: ' + message);
        setPaymentResult({ success: false, message: 'Booking is already paid, failed, or cancelled.' });
      } else {
        toast.error(message);
        setPaymentResult({ success: false, message });
      }
      fetchBooking(true);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      const response = await cancelBookingApi(id);
      toast.success(response.message || 'Booking cancelled');
      setIsCancelModalOpen(false);
      fetchBooking();
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Booking Not Found"
        description="The requested appointment booking record could not be found or you do not have permission to view it."
        actionLabel="Back to My Bookings"
        onAction={() => window.location.href = '/bookings'}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link to="/bookings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Bookings</span>
      </Link>

      {/* Main Status Header Card */}
      <Card className="bg-white border-slate-200/80 shadow-md p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant={booking.status} className="text-sm px-3 py-1">
                {booking.status}
              </Badge>
              {booking.status === 'PENDING' && (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Auto-polling status...
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {booking.test?.name || 'Diagnostic Test Appointment'}
            </h1>
            <p className="text-xs font-mono text-slate-400">Booking Reference ID: {booking.id}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {booking.status === 'PENDING' && (
              <Button
                variant="primary"
                size="lg"
                icon={CreditCard}
                onClick={handleOpenPayModal}
              >
                Pay Now (₹{booking.amount?.toFixed(2)})
              </Button>
            )}

            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <Button
                variant="outline"
                size="md"
                icon={Ban}
                onClick={() => setIsCancelModalOpen(true)}
              >
                Cancel Booking
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointment & Test Info */}
        <Card className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" />
            <span>Appointment Details</span>
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Scheduled Date & Time</span>
              <p className="font-bold text-slate-900 mt-0.5">{formatDate(booking.appointmentDatetime)}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Price Snapshot (Locked at Booking)</span>
              <p className="text-lg font-extrabold text-brand-700 mt-0.5">₹{booking.amount?.toFixed(2)} INR</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Booking Created On</span>
              <p className="text-slate-700 mt-0.5">{formatDate(booking.createdAt)}</p>
            </div>
          </div>
        </Card>

        {/* Diagnostic Centre Info */}
        <Card className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <span>Diagnostic Centre Info</span>
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Facility Name</span>
              <p className="font-bold text-slate-900 mt-0.5">{booking.centre?.name || 'Diagnostic Centre'}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Address / Location</span>
              <p className="text-slate-700 mt-0.5">{booking.centre?.location || 'N/A'}</p>
            </div>

            <div className="pt-2">
              <Link to={`/centres/${booking.centreId}`}>
                <Button variant="ghost" size="sm" className="text-xs p-0 text-brand-600 hover:text-brand-700">
                  View full centre catalog →
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Gateway Record */}
      {booking.payment && (
        <Card className="bg-slate-900 text-white space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span>Simulated Payment Gateway Record</span>
            </h3>
            <Badge variant={booking.payment.status}>{booking.payment.status}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block mb-1">Provider Reference ID</span>
              <span className="text-slate-200 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800 block truncate">
                {booking.payment.providerReferenceId}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Total Charged</span>
              <span className="text-slate-200 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800 block">
                ₹{booking.payment.amount?.toFixed(2)} INR
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Timestamp</span>
              <span className="text-slate-200 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800 block">
                {new Date(booking.payment.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Modal: Pay Now Gateway Simulation */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Simulate Payment Gateway">
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Merchant</span>
              <span className="font-semibold text-slate-800">EVE Healthcare Services</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Booking Ref</span>
              <span className="font-mono text-slate-800">{booking.id}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-base font-extrabold text-slate-900">
              <span>Amount Due</span>
              <span className="text-brand-700">₹{booking.amount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Test Simulation Controls */}
          {booking.status === 'PENDING' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-2">
              <label className="flex items-center gap-2 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Simulate Gateway Payment Failure</span>
              </label>
              <p className="text-[11px] text-amber-700">
                • <strong>Unchecked (Default)</strong>: Payment will <strong>SUCCEED</strong> (confirms booking).<br />
                • <strong>Checked</strong>: Payment will <strong>FAIL</strong> (sets booking to FAILED).
              </p>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Status for this booking is now <strong>{booking.status}</strong>.</span>
            </div>
          )}

          {/* Payment Result Banner */}
          {paymentResult && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${
                paymentResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {paymentResult.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
              )}
              <span>{paymentResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPayModalOpen(false)}
              disabled={isProcessingPayment}
            >
              Close
            </Button>
            {booking.status === 'PENDING' && (
              <Button
                variant="primary"
                isLoading={isProcessingPayment}
                onClick={handlePayNow}
                disabled={paymentResult?.success}
              >
                {isProcessingPayment ? 'Processing Payment...' : 'Confirm Payment'}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal: Confirm Cancel Booking */}
      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Appointment">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <p>
              Are you sure you want to cancel this appointment for <strong>{booking.test?.name}</strong>?
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} disabled={isCancelling}>
              Keep Appointment
            </Button>
            <Button variant="danger" isLoading={isCancelling} onClick={handleCancelBooking}>
              Yes, Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
