import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { triggerWebhookApi } from '../../api/webhooks';
import toast from 'react-hot-toast';

export const DevToolsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [eventId, setEventId] = useState(`evt_demo_${Math.floor(Math.random() * 9000 + 1000)}`);
  const [bookingId, setBookingId] = useState('');
  const [status, setStatus] = useState('SUCCESS');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  const handleSubmitWebhook = async (e) => {
    e.preventDefault();
    if (!bookingId.trim()) {
      toast.error('Please enter a booking ID');
      return;
    }

    setIsLoading(true);
    setLastResponse(null);
    try {
      const response = await triggerWebhookApi({
        eventId,
        bookingId: bookingId.trim(),
        status,
      });

      setLastResponse(response);
      if (response.data?.duplicate) {
        toast.custom(
          (t) => (
            <div className="bg-amber-900 text-amber-100 p-3 rounded-lg shadow-lg flex items-center gap-2 border border-amber-700 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold">Idempotency Triggered!</p>
                <p className="text-xs text-amber-200">Event '{eventId}' was already processed. DB state left untouched.</p>
              </div>
            </div>
          ),
          { duration: 4000 }
        );
      } else {
        toast.success(`Webhook processed for booking '${bookingId.substring(0, 8)}...'`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Webhook invocation failed');
      setLastResponse(error.response?.data || { error: 'Request failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden w-80 md:w-96 transition-all duration-300">
        {/* Panel Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-750 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-teal-400 border-b border-slate-700 select-none"
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-teal-400" />
            <span>Developer Tools (Webhook Tester)</span>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* Panel Body */}
        {isOpen && (
          <div className="p-4 text-xs space-y-3">
            <p className="text-slate-400 leading-relaxed">
              Manually trigger backend webhook payloads (<code className="text-teal-300">POST /payments/webhook</code>) to evaluate live idempotency & status transitions.
            </p>

            <form onSubmit={handleSubmitWebhook} className="space-y-2.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event ID (Unique Constraint)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-teal-500 font-mono text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setEventId(`evt_demo_${Math.floor(Math.random() * 9000 + 1000)}`)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300"
                    title="Generate Random Event ID"
                  >
                    Random
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Booking ID</label>
                <input
                  type="text"
                  placeholder="e.g. bkg_12345"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-teal-500 font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Simulated Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-teal-500 font-mono text-xs"
                >
                  <option value="SUCCESS">SUCCESS (Confirms Booking)</option>
                  <option value="FAILED">FAILED (Fails Booking)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Sending...' : 'Fire Webhook Event'}</span>
              </button>
            </form>

            {/* Response Output */}
            {lastResponse && (
              <div className="mt-3 p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono overflow-x-auto">
                <div className="flex items-center gap-1.5 mb-1 text-teal-400 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Response Payload:</span>
                </div>
                <pre className="text-slate-300 whitespace-pre-wrap">{JSON.stringify(lastResponse, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
