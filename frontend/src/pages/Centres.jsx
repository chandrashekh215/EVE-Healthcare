import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCentresApi, createCentreApi } from '../api/centres';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Building2, MapPin, ChevronRight, Plus, ChevronLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export const Centres = () => {
  const [centres, setCentres] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 6, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCentre, setNewCentre] = useState({ name: '', location: '' });
  const [isCreating, setIsCreating] = useState(false);

  const fetchCentres = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await getCentresApi({ page, pageSize: 6 });
      setCentres(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching centres:', error);
      toast.error('Failed to load diagnostic centres');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCentres(1);
  }, []);

  const handleCreateCentre = async (e) => {
    e.preventDefault();
    if (!newCentre.name || !newCentre.location) return;

    setIsCreating(true);
    try {
      await createCentreApi(newCentre);
      toast.success('Diagnostic centre created successfully!');
      setNewCentre({ name: '', location: '' });
      setIsModalOpen(false);
      fetchCentres(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create centre');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-teal-800 rounded-3xl p-8 text-white shadow-xl shadow-brand-900/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/30 text-teal-200 border border-brand-400/30 backdrop-blur-xs mb-3">
            <Building2 className="w-3.5 h-3.5" /> Diagnostic Network
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Diagnostic Centres</h1>
          <p className="mt-2 text-teal-100 text-sm sm:text-base leading-relaxed">
            Browse verified diagnostic labs, view available medical test catalogs, and book appointments instantly with snapshot pricing.
          </p>
        </div>
        <div className="absolute right-6 bottom-6 opacity-10 hidden md:block">
          <Building2 className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Available Medical Centres</h2>
          <p className="text-xs text-slate-500">Showing {centres.length} of {pagination.totalItems || 0} centres</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add New Centre
        </Button>
      </div>

      {/* Card Grid */}
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
      ) : centres.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Diagnostic Centres Found"
          description="Click the button below to create the first diagnostic centre in the system."
          actionLabel="Add Diagnostic Centre"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centres.map((centre) => (
            <Card key={centre.id} hoverable className="flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 mb-3 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                  {centre.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{centre.location}</span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {centre.tests ? `${centre.tests.length} tests listed` : 'View catalog'}
                </span>
                <Link to={`/centres/${centre.id}`}>
                  <Button variant="outline" size="sm" icon={ChevronRight}>
                    View Details
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
            onClick={() => fetchCentres(pagination.page - 1)}
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
            onClick={() => fetchCentres(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Modal: Create Centre */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Diagnostic Centre">
        <form onSubmit={handleCreateCentre} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Centre Name</label>
            <input
              type="text"
              placeholder="e.g. Apex Diagnostics Lab"
              value={newCentre.name}
              onChange={(e) => setNewCentre({ ...newCentre, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Location / Address</label>
            <input
              type="text"
              placeholder="e.g. 5th Avenue, Suite 200, New York"
              value={newCentre.location}
              onChange={(e) => setNewCentre({ ...newCentre, location: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Create Centre
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
