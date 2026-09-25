import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserBookingsApi } from '../api/bookings';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { CalendarCheck, Clock, Building2, ChevronRight, IndianRupee, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 6, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await getUserBookingsApi({ page, pageSize: 6 });
      setBookings(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load your bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Diagnostic Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your medical appointment schedule, payments, and booking statuses.
          </p>
        </div>
        <Link to="/tests">
          <Button variant="primary">Book New Test</Button>
        </Link>
      </div>

      {/* Bookings Grid / Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full mt-4" />
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No Bookings Found"
          description="You have not booked any diagnostic tests yet. Browse available tests and schedule your first appointment."
          actionLabel="Browse Tests"
          onAction={() => window.location.href = '/tests'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id} hoverable className="flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={booking.status}>{booking.status}</Badge>
                  <span className="text-sm font-extrabold text-slate-900">
                    ₹{booking.amount?.toFixed(2)}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                    {booking.test?.name || 'Diagnostic Test'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{booking.centre?.name || 'Diagnostic Centre'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>{formatDate(booking.appointmentDatetime)}</span>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]">
                  ID: {booking.id}
                </span>
                <Link to={`/bookings/${booking.id}`}>
                  <Button variant={booking.status === 'PENDING' ? 'primary' : 'outline'} size="sm" icon={ChevronRight}>
                    {booking.status === 'PENDING' ? 'Pay Now' : 'View Details'}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchBookings(pagination.page - 1)}
            icon={ChevronLeft}
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchBookings(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
