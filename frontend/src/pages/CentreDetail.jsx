import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCentreByIdApi, addTestToCentreApi } from '../api/centres';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { BookingModal } from '../components/booking/BookingModal';
import { Building2, MapPin, Plus, ArrowLeft, Calendar, IndianRupee, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export const CentreDetail = () => {
  const { id } = useParams();
  const [centre, setCentre] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Booking modal state
  const [selectedTest, setSelectedTest] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Add test modal state
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [newTest, setNewTest] = useState({ name: '', price: '' });
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  const fetchCentreDetail = async () => {
    setIsLoading(true);
    try {
      const response = await getCentreByIdApi(id);
      setCentre(response.data);
    } catch (error) {
      console.error('Error fetching centre details:', error);
      toast.error('Diagnostic centre not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCentreDetail();
  }, [id]);

  const handleOpenBooking = (test) => {
    setSelectedTest(test);
    setIsBookingOpen(true);
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!newTest.name || !newTest.price) return;

    setIsSubmittingTest(true);
    try {
      await addTestToCentreApi(id, {
        name: newTest.name.trim(),
        price: parseFloat(newTest.price),
      });
      toast.success('Diagnostic test added successfully!');
      setNewTest({ name: '', price: '' });
      setIsAddTestOpen(false);
      fetchCentreDetail();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to add test');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!centre) {
    return (
      <EmptyState
        icon={Building2}
        title="Centre Not Found"
        description="The requested diagnostic centre could not be found."
        actionLabel="Back to Centres"
        onAction={() => window.history.back()}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link to="/centres" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Diagnostic Centres</span>
      </Link>

      {/* Centre Header */}
      <Card className="bg-white border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shrink-0 border border-brand-100 shadow-xs">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{centre.name}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span>{centre.location}</span>
              </div>
            </div>
          </div>

          <Button variant="primary" icon={Plus} onClick={() => setIsAddTestOpen(true)}>
            Add New Test
          </Button>
        </div>
      </Card>

      {/* Test Catalog Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Available Tests Catalog</h2>
          <span className="text-xs font-semibold text-slate-500">
            {centre.tests?.length || 0} tests available
          </span>
        </div>

        {centre.tests?.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Tests Added Yet"
            description="There are currently no diagnostic tests listed for this centre. Click below to add one."
            actionLabel="Add First Diagnostic Test"
            onAction={() => setIsAddTestOpen(true)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Diagnostic Test Name</th>
                    <th className="px-6 py-4">Standard Price</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {centre.tests.map((test) => (
                    <tr key={test.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <Activity className="w-4 h-4 text-brand-600 shrink-0" />
                          <span>{test.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-xs border border-slate-200">
                          ₹{test.price?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Calendar}
                          onClick={() => handleOpenBooking(test)}
                        >
                          Book This Test
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        test={selectedTest}
        centreName={centre.name}
      />

      {/* Modal: Add Test */}
      <Modal isOpen={isAddTestOpen} onClose={() => setIsAddTestOpen(false)} title="Add Diagnostic Test">
        <form onSubmit={handleAddTest} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Test Name</label>
            <input
              type="text"
              placeholder="e.g. Complete Blood Count (CBC)"
              value={newTest.name}
              onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Price (₹ INR)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 450.00"
              value={newTest.price}
              onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddTestOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingTest}>
              Add Test to Centre
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
