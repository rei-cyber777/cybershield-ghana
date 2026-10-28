import React, { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { formatSubscribersToCsv, FeedbackRow, SubscriberRow } from '../lib/storage';
import {
  Shield,
  Lock,
  LogOut,
  CheckCircle2,
  XCircle,
  Trash2,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  PlusCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface DbScamReport {
  id: string;
  scam_type: string;
  channel: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected' | 'dismissed';
  created_at: string;
}

interface DbVerifiedAlert {
  id: string;
  title: string;
  scam_type: string;
  channel: string;
  summary: string;
  prevention_tip: string;
  severity: string;
  published: boolean;
  published_at: string;
}

type AdminTab = 'reports' | 'alerts' | 'subscribers' | 'feedback';

export const AdminDashboard: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<
    'checking' | 'unauthenticated' | 'access_denied' | 'authorized'
  >('checking');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('reports');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [actionBanner, setActionBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Admin datasets (populated ONLY when authorized via is_admin())
  const [reports, setReports] = useState<DbScamReport[]>([]);
  const [alerts, setAlerts] = useState<DbVerifiedAlert[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackRow[]>([]);

  // New Alert creation form state
  const [newAlertTitle, setNewAlertTitle] = useState<string>('');
  const [newAlertType, setNewAlertType] = useState<string>('Mobile Money Fraud');
  const [newAlertChannel, setNewAlertChannel] = useState<string>('WhatsApp');
  const [newAlertSummary, setNewAlertSummary] = useState<string>('');
  const [newAlertTip, setNewAlertTip] = useState<string>(
    'Verify independently through official USSD or institutional websites. Never share your PIN or OTP.'
  );

  const loadAdminData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setIsLoadingData(true);

    try {
      const [repRes, alertRes, subRes, fbRes] = await Promise.all([
        supabase
          .from('scam_reports')
          .select('id, scam_type, channel, description, status, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('verified_alerts')
          .select(
            'id, title, scam_type, channel, summary, prevention_tip, severity, published, published_at'
          )
          .order('published_at', { ascending: false }),
        supabase
          .from('subscribers')
          .select('id, email, interests, confirmed, confirmed_at, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('feedback')
          .select('id, category, message, created_at')
          .order('created_at', { ascending: false }),
      ]);

      if (repRes.data) setReports(repRes.data as DbScamReport[]);
      if (alertRes.data) setAlerts(alertRes.data as DbVerifiedAlert[]);
      if (subRes.data) setSubscribers(subRes.data as SubscriberRow[]);
      if (fbRes.data) setFeedbackList(fbRes.data as FeedbackRow[]);
    } catch (err) {
      console.error('[CyberShield Admin] Failed to fetch admin datasets:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const verifyAdminSession = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthStatus('unauthenticated');
      setAuthError('Supabase client is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setAuthStatus('unauthenticated');
      setAdminEmail('');
      return;
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');

    if (rpcError || isAdmin !== true) {
      await supabase.auth.signOut();
      setAdminEmail('');
      setAuthStatus('access_denied');
      setAuthError('Access denied: Your account is not registered in public.admins.');
      return;
    }

    setAdminEmail(session.user.email || 'Admin');
    setAuthStatus('authorized');
    await loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    verifyAdminSession();
  }, [verifyAdminSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsLoggingIn(false);
      setAuthError('Supabase client is not configured.');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error || !data.session) {
      setIsLoggingIn(false);
      setAuthError(error?.message || 'Invalid login credentials.');
      return;
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
    if (rpcError || isAdmin !== true) {
      await supabase.auth.signOut();
      setIsLoggingIn(false);
      setLoginPassword('');
      setAuthStatus('access_denied');
      setAuthError('Access denied: This user is not authorized as an administrator.');
      return;
    }

    setLoginPassword('');
    setIsLoggingIn(false);
    setAdminEmail(data.session.user.email || 'Admin');
    setAuthStatus('authorized');
    await loadAdminData();
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setReports([]);
    setAlerts([]);
    setSubscribers([]);
    setFeedbackList([]);
    setAdminEmail('');
    setAuthStatus('unauthenticated');
  };

  const handleApproveAndPublishReport = async (report: DbScamReport) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setActionBanner(null);

    const alertTitle = `${report.scam_type} Warning (${report.channel})`;
    const { error: insertErr } = await supabase.from('verified_alerts').insert({
      title: alertTitle,
      scam_type: report.scam_type,
      channel: report.channel,
      summary: report.description,
      prevention_tip:
        'Verify independently through official USSD or institutional websites. Never send fees or PIN codes.',
      severity: 'Moderate',
      published: true,
    });

    if (insertErr) {
      setActionBanner({ type: 'error', text: `Failed to publish alert: ${insertErr.message}` });
      return;
    }

    const { error: updateErr } = await supabase
      .from('scam_reports')
      .update({ status: 'verified' })
      .eq('id', report.id);

    if (updateErr) {
      setActionBanner({ type: 'error', text: `Failed to update report: ${updateErr.message}` });
      return;
    }

    setActionBanner({
      type: 'success',
      text: 'Report approved and published to Verified Alerts.',
    });
    await loadAdminData();
  };

  const handleRejectReport = async (reportId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setActionBanner(null);

    const { error } = await supabase
      .from('scam_reports')
      .update({ status: 'rejected' })
      .eq('id', reportId);

    if (error) {
      setActionBanner({ type: 'error', text: `Could not reject report: ${error.message}` });
      return;
    }

    setActionBanner({ type: 'success', text: 'Report marked as rejected.' });
    await loadAdminData();
  };

  const handleDeleteReport = async (reportId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setActionBanner(null);

    const { error } = await supabase.from('scam_reports').delete().eq('id', reportId);
    if (error) {
      setActionBanner({ type: 'error', text: `Could not delete report: ${error.message}` });
      return;
    }

    setActionBanner({ type: 'success', text: 'Report deleted.' });
    await loadAdminData();
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setActionBanner(null);

    const { error } = await supabase.from('verified_alerts').insert({
      title: newAlertTitle.trim(),
      scam_type: newAlertType,
      channel: newAlertChannel,
      summary: newAlertSummary.trim(),
      prevention_tip: newAlertTip.trim(),
      severity: 'Moderate',
      published: true,
    });

    if (error) {
      setActionBanner({ type: 'error', text: `Could not publish alert: ${error.message}` });
      return;
    }

    setNewAlertTitle('');
    setNewAlertSummary('');
    setActionBanner({ type: 'success', text: 'New community alert published.' });
    await loadAdminData();
  };

  const handleToggleAlertPublished = async (alert: DbVerifiedAlert) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setActionBanner(null);

    const { error } = await supabase
      .from('verified_alerts')
      .update({ published: !alert.published })
      .eq('id', alert.id);

    if (error) {
      setActionBanner({ type: 'error', text: `Could not update alert: ${error.message}` });
      return;
    }

    setActionBanner({
      type: 'success',
      text: !alert.published ? 'Alert published publicly.' : 'Alert unpublished.',
    });
    await loadAdminData();
  };

  const handleDeleteAlert = async (alertId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setActionBanner(null);

    const { error } = await supabase.from('verified_alerts').delete().eq('id', alertId);
    if (error) {
      setActionBanner({ type: 'error', text: `Could not delete alert: ${error.message}` });
      return;
    }

    setActionBanner({ type: 'success', text: 'Alert deleted.' });
    await loadAdminData();
  };

  const handleExportSubscribersCsv = () => {
    const csvContent = formatSubscribersToCsv(subscribers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `cybershield-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteSubscriber = async (subId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setActionBanner(null);

    const { error } = await supabase.from('subscribers').delete().eq('id', subId);
    if (error) {
      setActionBanner({ type: 'error', text: `Could not delete subscriber: ${error.message}` });
      return;
    }

    setActionBanner({ type: 'success', text: 'Subscriber removed.' });
    await loadAdminData();
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setActionBanner(null);

    const { error } = await supabase.from('feedback').delete().eq('id', feedbackId);
    if (error) {
      setActionBanner({ type: 'error', text: `Could not delete feedback: ${error.message}` });
      return;
    }

    setActionBanner({ type: 'success', text: 'Feedback entry deleted.' });
    await loadAdminData();
  };

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="cybershield-grid-bg min-h-screen text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-cyan-400" aria-hidden="true" />
            <div>
              <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
                CyberShield Ghana · Owner Admin Portal
              </h1>
              <p className="font-mono text-xs text-slate-400">
                Protected by Supabase Auth + PostgreSQL Row Level Security (`public.is_admin()`)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-cyan-400/50 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to Public Site</span>
            </a>

            {authStatus === 'authorized' && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/40 bg-rose-950/30 px-3.5 py-2 text-xs font-bold text-rose-200 hover:bg-rose-900/50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Log Out ({adminEmail})</span>
              </button>
            )}
          </div>
        </div>

        {/* LOGIN VIEW (when unauthenticated, checking, or access_denied) */}
        {authStatus !== 'authorized' && (
          <div className="mx-auto max-w-md cybershield-glass rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
              <Lock className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>ADMINISTRATOR AUTHENTICATION</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">
              Admin Sign In
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Sign in with your Supabase administrator email and password. Non-admin accounts are
              automatically signed out.
            </p>

            {authStatus === 'access_denied' && (
              <div
                role="alert"
                data-testid="admin-access-denied"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-400/50 bg-rose-950/40 p-4 text-xs text-rose-100"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <div>
                  <strong className="block font-bold text-rose-300">Access denied</strong>
                  <span>
                    Your account is not listed in `public.admins` and has been signed out.
                  </span>
                </div>
              </div>
            )}

            {authError && authStatus !== 'access_denied' && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-400/50 bg-rose-950/40 p-3.5 text-xs text-rose-100"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="admin-login-email"
                  className="block text-xs font-semibold text-slate-200"
                >
                  Admin Email
                </label>
                <input
                  id="admin-login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-login-password"
                  className="block text-xs font-semibold text-slate-200"
                >
                  Password
                </label>
                <input
                  id="admin-login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn || authStatus === 'checking'}
                className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:bg-cyan-300 disabled:opacity-60 transition-colors"
              >
                {isLoggingIn
                  ? 'Verifying Admin Credentials...'
                  : authStatus === 'checking'
                  ? 'Checking Session...'
                  : 'Sign In to Admin Dashboard'}
              </button>
            </form>
          </div>
        )}

        {/* AUTHORIZED ADMIN DASHBOARD (`is_admin() === true`) */}
        {authStatus === 'authorized' && (
          <div className="space-y-8">
            {/* Summary Metrics Bar */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="cybershield-glass rounded-xl p-5">
                <div className="font-mono text-xs text-amber-300">Pending Scam Reports</div>
                <div className="mt-2 font-display text-3xl font-extrabold text-white tabular-nums">
                  {pendingReportsCount}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {reports.length} total reports in database
                </div>
              </div>

              <div className="cybershield-glass rounded-xl p-5">
                <div className="font-mono text-xs text-cyan-300">Published Alerts</div>
                <div className="mt-2 font-display text-3xl font-extrabold text-white tabular-nums">
                  {alerts.filter((a) => a.published).length}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {alerts.length} total alerts ({alerts.filter((a) => !a.published).length} hidden)
                </div>
              </div>

              <div className="cybershield-glass rounded-xl p-5">
                <div className="font-mono text-xs text-emerald-300">Newsletter Subscribers</div>
                <div className="mt-2 font-display text-3xl font-extrabold text-white tabular-nums">
                  {subscribers.length}
                </div>
                <div className="mt-1 text-xs text-slate-400">Ready for CSV export</div>
              </div>

              <div className="cybershield-glass rounded-xl p-5">
                <div className="font-mono text-xs text-violet-300">Community Feedback</div>
                <div className="mt-2 font-display text-3xl font-extrabold text-white tabular-nums">
                  {feedbackList.length}
                </div>
                <div className="mt-1 text-xs text-slate-400">Anonymous suggestions & notes</div>
              </div>
            </div>

            {actionBanner && (
              <div
                role="status"
                className={`rounded-xl border p-4 text-xs font-medium ${
                  actionBanner.type === 'success'
                    ? 'border-emerald-400/50 bg-emerald-950/35 text-emerald-100'
                    : 'border-rose-400/50 bg-rose-950/40 text-rose-100'
                }`}
              >
                {actionBanner.text}
              </div>
            )}

            {/* Admin Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div
                role="tablist"
                aria-label="Admin Dashboard Sections"
                className="inline-flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-[#070c1c] p-1.5"
              >
                <button
                  role="tab"
                  type="button"
                  aria-selected={activeTab === 'reports'}
                  onClick={() => setActiveTab('reports')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    activeTab === 'reports'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  Scam Reports ({reports.length})
                </button>
                <button
                  role="tab"
                  type="button"
                  aria-selected={activeTab === 'alerts'}
                  onClick={() => setActiveTab('alerts')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    activeTab === 'alerts'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  Alerts ({alerts.length})
                </button>
                <button
                  role="tab"
                  type="button"
                  aria-selected={activeTab === 'subscribers'}
                  onClick={() => setActiveTab('subscribers')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    activeTab === 'subscribers'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  Subscribers ({subscribers.length})
                </button>
                <button
                  role="tab"
                  type="button"
                  aria-selected={activeTab === 'feedback'}
                  onClick={() => setActiveTab('feedback')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    activeTab === 'feedback'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  Feedback ({feedbackList.length})
                </button>
              </div>

              <button
                type="button"
                onClick={loadAdminData}
                disabled={isLoadingData}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-cyan-400/50 transition-colors"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoadingData ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Refresh Data</span>
              </button>
            </div>

            {/* TAB 1: SCAM REPORTS MODERATION */}
            {activeTab === 'reports' && (
              <div className="cybershield-glass rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-white">
                  Anonymous Scam Reports Queue
                </h2>

                {reports.length === 0 ? (
                  <p className="text-xs text-slate-400">No scam reports in the database yet.</p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((rep) => (
                      <div
                        key={rep.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-[#070d20] p-4 md:flex-row md:items-center"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                            <span
                              className={
                                rep.status === 'pending'
                                  ? 'text-amber-300'
                                  : rep.status === 'verified'
                                  ? 'text-emerald-300'
                                  : 'text-rose-300'
                              }
                            >
                              [{rep.status.toUpperCase()}]
                            </span>
                            <span className="text-cyan-300">{rep.scam_type}</span>
                            <span className="text-slate-400">· {rep.channel}</span>
                            <span className="text-slate-500">
                              · {String(rep.created_at).slice(0, 16).replace('T', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200">{rep.description}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {rep.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveAndPublishReport(rep)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-300 transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Approve & Publish Alert</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectReport(rep.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-900/40 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(rep.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/40 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ALERTS MANAGEMENT */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                {/* Create Alert Form */}
                <form
                  onSubmit={handleCreateAlert}
                  className="cybershield-glass rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
                    <PlusCircle className="h-4 w-4" />
                    <span>PUBLISH NEW COMMUNITY ALERT</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label
                        htmlFor="new-alert-title"
                        className="block text-xs font-semibold text-slate-200"
                      >
                        Alert Title
                      </label>
                      <input
                        id="new-alert-title"
                        type="text"
                        required
                        minLength={5}
                        value={newAlertTitle}
                        onChange={(e) => setNewAlertTitle(e.target.value)}
                        placeholder="e.g., Fake Scholarship Fee Links on WhatsApp"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-alert-type"
                        className="block text-xs font-semibold text-slate-200"
                      >
                        Scam Category
                      </label>
                      <select
                        id="new-alert-type"
                        value={newAlertType}
                        onChange={(e) => setNewAlertType(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                      >
                        <option value="Mobile Money Fraud">Mobile Money Fraud</option>
                        <option value="Fake Jobs & Scholarships">Fake Jobs & Scholarships</option>
                        <option value="Investment Scams">Investment Scams</option>
                        <option value="Phishing">Phishing</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="new-alert-channel"
                        className="block text-xs font-semibold text-slate-200"
                      >
                        Channel
                      </label>
                      <select
                        id="new-alert-channel"
                        value={newAlertChannel}
                        onChange={(e) => setNewAlertChannel(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="SMS">SMS</option>
                        <option value="Phone Call">Phone Call</option>
                        <option value="Social Media">Social Media</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="new-alert-summary"
                        className="block text-xs font-semibold text-slate-200"
                      >
                        Summary (15–1000 chars)
                      </label>
                      <textarea
                        id="new-alert-summary"
                        rows={2}
                        required
                        minLength={15}
                        value={newAlertSummary}
                        onChange={(e) => setNewAlertSummary(e.target.value)}
                        placeholder="Describe how the scam works..."
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-alert-tip"
                        className="block text-xs font-semibold text-slate-200"
                      >
                        Prevention Tip
                      </label>
                      <textarea
                        id="new-alert-tip"
                        rows={2}
                        required
                        value={newAlertTip}
                        onChange={(e) => setNewAlertTip(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-colors"
                  >
                    Publish Alert
                  </button>
                </form>

                {/* Existing Alerts List */}
                <div className="cybershield-glass rounded-2xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-white">
                    Published & Draft Alerts
                  </h2>

                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-400">No alerts in `verified_alerts` yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map((al) => (
                        <div
                          key={al.id}
                          className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-[#070d20] p-4 md:flex-row md:items-center"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                              <span
                                className={
                                  al.published ? 'text-emerald-300' : 'text-slate-400'
                                }
                              >
                                {al.published ? '[PUBLISHED]' : '[UNPUBLISHED]'}
                              </span>
                              <span className="text-cyan-300">{al.scam_type}</span>
                              <span className="text-slate-400">· {al.channel}</span>
                            </div>
                            <h3 className="font-display text-sm font-bold text-white">
                              {al.title}
                            </h3>
                            <p className="text-xs text-slate-300">{al.summary}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleAlertPublished(al)}
                              className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/40 transition-colors"
                            >
                              {al.published ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  <span>Unpublish</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Publish</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAlert(al.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/40 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SUBSCRIBERS & CSV EXPORT */}
            {activeTab === 'subscribers' && (
              <div className="cybershield-glass rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">
                      Newsletter Subscribers ({subscribers.length})
                    </h2>
                    <p className="text-xs text-slate-400">
                      Protected by admin-only SELECT policy on `public.subscribers`.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportSubscribersCsv}
                    disabled={subscribers.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-50 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export CSV ({subscribers.length})</span>
                  </button>
                </div>

                {subscribers.length === 0 ? (
                  <p className="text-xs text-slate-400">No subscribers found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 font-mono text-slate-400">
                          <th className="py-2.5 pr-4">Email</th>
                          <th className="py-2.5 pr-4">Opt-In Status</th>
                          <th className="py-2.5 pr-4">Interests</th>
                          <th className="py-2.5 pr-4">Joined</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {subscribers.map((sub) => (
                          <tr key={sub.id}>
                            <td className="py-3 pr-4 font-mono text-white">{sub.email}</td>
                            <td className="py-3 pr-4 font-mono">
                              {sub.confirmed ? (
                                <span className="rounded bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-400/30">
                                  CONFIRMED
                                </span>
                              ) : (
                                <span className="rounded bg-amber-950/60 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                                  PENDING
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-slate-300">{sub.interests}</td>
                            <td className="py-3 pr-4 font-mono text-slate-400">
                              {String(sub.created_at).slice(0, 16).replace('T', ' ')}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteSubscriber(sub.id)}
                                className="inline-flex items-center gap-1 rounded border border-rose-400/40 bg-rose-950/30 px-2.5 py-1 text-[11px] text-rose-200 hover:bg-rose-900/40"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: COMMUNITY FEEDBACK */}
            {activeTab === 'feedback' && (
              <div className="cybershield-glass rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-white">
                  Anonymous Community Feedback ({feedbackList.length})
                </h2>

                {feedbackList.length === 0 ? (
                  <p className="text-xs text-slate-400">No feedback submissions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {feedbackList.map((fb) => (
                      <div
                        key={fb.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-[#070d20] p-4 md:flex-row md:items-center"
                      >
                        <div className="space-y-1">
                          <div className="font-mono text-xs text-cyan-300">
                            {fb.category} · {String(fb.created_at).slice(0, 16).replace('T', ' ')}
                          </div>
                          <p className="text-sm text-slate-200">{fb.message}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteFeedback(fb.id)}
                          className="inline-flex items-center gap-1 self-start rounded-lg border border-rose-400/40 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/40 md:self-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
