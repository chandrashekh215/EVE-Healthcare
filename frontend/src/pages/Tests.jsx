import React, { useState, useEffect } from 'react';
import { getTestsApi } from '../api/tests';
import { getCentresApi } from '../api/centres';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { BookingModal } from '../components/booking/BookingModal';
import { FileSearch, Search, Filter, Building2, Calendar, Activity, X, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

export const Tests = () => {
  const [tests, setTests] = useState([]);
  const [centres, setCentres] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 9, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Booking Modal State
  const [selectedTest, setSelectedTest] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const fetchCentresList = async () => {
    try {
      const response = await getCentresApi({ page: 1, pageSize: 100 });
      setCentres(response.data);
    } catch (error) {
      console.error('Failed to load centres dropdown:', error);
    }
  };

  const fetchTests = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await getTestsApi({
        page,
        pageSize: 9,
        name: searchName.trim() || undefined,
        centreId: selectedCentreId || undefined,
      });
      setTests(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to load diagnostic tests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCentresList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTests(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchName, selectedCentreId]);

  const handleOpenBooking = (test) => {
    setSelectedTest(test);
    setIsBookingOpen(true);
  };

  const handleClearFilters = () => {
    setSearchName('');
    setSelectedCentreId('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Search Diagnostic Tests</h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore medical procedures and laboratory tests offered across all healthcare centres.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by test name (e.g. Blood Panel, Lipid, Glucose)..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
          />
          {searchName && (
            <button
              onClick={() => setSearchName('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Centre Dropdown Filter */}
        <div className="relative sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
          <select
            value={selectedCentreId}
            onChange={(e) => setSelectedCentreId(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500 appearance-none font-medium cursor-pointer"
          >
            <option value="">All Diagnostic Centres</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {(searchName || selectedCentreId) && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="self-center">
            Reset Filters
          </Button>
        )}
      </div>

      {/* Tests Grid */}
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
      ) : tests.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No Diagnostic Tests Found"
          description="Try broadening your search keywords or clearing selected centre filters."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Card key={test.id} hoverable className="flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-base font-extrabold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                    ₹{test.price?.toFixed(2)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                  {test.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{test.centre?.name || 'Diagnostic Centre'}</span>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  icon={Calendar}
                  onClick={() => handleOpenBooking(test)}
                >
                  Book This Test
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        test={selectedTest}
      />
    </div>
  );
};
