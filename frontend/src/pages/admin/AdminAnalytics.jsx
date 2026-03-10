import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  HiOutlineDownload, HiOutlineRefresh, HiOutlineCurrencyRupee,
  HiOutlineUsers, HiOutlineTicket, HiOutlineTrendingUp,
  HiOutlineClock, HiOutlineChartBar, HiOutlineCalendar, HiOutlineOfficeBuilding,
} from 'react-icons/hi';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const STATUS_COLORS = { Confirmed: '#3B82F6', Active: '#10B981', Completed: '#8B5CF6', Cancelled: '#EF4444' };

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  const fetchAnalytics = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const res = await api.get('/admin/analytics');
      setData(res.data.data);
      if (showToast) toast.success('Analytics refreshed');
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // PDF Export
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    toast.loading('Generating PDF report...', { id: 'pdf' });

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1400,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Header
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pdfWidth, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SmartPark Analytics Report', 10, 16);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 24);
      pdf.text(`Period: Last ${timeRange === '7d' ? '7 Days' : timeRange === '30d' ? '30 Days' : '12 Months'}`, 10, 30);

      // Summary section
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', 10, 45);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const summaryData = [
        ['Total Revenue', formatCurrency(data.totalRevenue)],
        ["Today's Revenue", formatCurrency(data.todayRevenue)],
        ['Total Bookings', String(data.totalBookings)],
        ['Active Bookings', String(data.activeBookings)],
        ['Total Users', String(data.totalUsers)],
        ['Parking Lots', String(data.totalLots)],
        ['Total Slots', String(data.totalSlots)],
        ['Occupancy Rate', `${data.occupancyRate}%`],
        ['Avg Duration', `${data.avgDuration} hrs`],
        ['Cancellation Rate', `${data.cancellationRate}%`],
      ];

      let yPos = 52;
      summaryData.forEach(([label, value], i) => {
        const col = i % 2 === 0 ? 10 : 105;
        if (i > 0 && i % 2 === 0) yPos += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text(label + ':', col, yPos);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text(value, col + 45, yPos);
      });

      // Charts image
      yPos += 15;
      if (yPos + imgHeight > pdfHeight - 10) {
        pdf.addPage();
        yPos = 15;
      }
      pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth, imgHeight);

      // Footer on every page
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`SmartPark Analytics Report | Page ${i} of ${pageCount}`, 10, pdfHeight - 8);
        pdf.text('Confidential', pdfWidth - 30, pdfHeight - 8);
      }

      pdf.save(`SmartPark_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report downloaded!', { id: 'pdf' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: 'pdf' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-center text-gray-500 py-12">No analytics data available</p>;

  // Prepare chart data
  const slotChartData = [
    { name: 'Available', value: data.availableSlots, color: '#10B981' },
    { name: 'Reserved', value: data.reservedSlots, color: '#F59E0B' },
    { name: 'Occupied', value: data.occupiedSlots, color: '#EF4444' },
  ].filter((s) => s.value > 0);

  const kpiCards = [
    { label: 'Total Revenue', value: formatCurrency(data.totalRevenue), icon: HiOutlineCurrencyRupee, textColor: 'text-green-600', bgLight: 'bg-green-50 dark:bg-green-900/20' },
    { label: "Today's Revenue", value: formatCurrency(data.todayRevenue), icon: HiOutlineTrendingUp, textColor: 'text-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Bookings', value: data.totalBookings, icon: HiOutlineTicket, textColor: 'text-purple-600', bgLight: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: "Today's Bookings", value: data.todayBookings, icon: HiOutlineCalendar, textColor: 'text-cyan-600', bgLight: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { label: 'Active Bookings', value: data.activeBookings, icon: HiOutlineTrendingUp, textColor: 'text-yellow-600', bgLight: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Total Users', value: data.totalUsers, icon: HiOutlineUsers, textColor: 'text-pink-600', bgLight: 'bg-pink-50 dark:bg-pink-900/20' },
    { label: 'Parking Lots', value: data.totalLots, icon: HiOutlineOfficeBuilding, textColor: 'text-indigo-600', bgLight: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Total Slots', value: data.totalSlots, icon: HiOutlineChartBar, textColor: 'text-slate-600', bgLight: 'bg-slate-50 dark:bg-slate-900/20' },
  ];

  const metricCards = [
    { label: 'Occupancy Rate', value: `${data.occupancyRate}%`, icon: '📊', desc: data.occupancyRate > 70 ? 'High demand' : 'Normal' },
    { label: 'Avg Duration', value: `${data.avgDuration} hrs`, icon: '⏱️', desc: 'Per booking' },
    { label: 'Cancellation Rate', value: `${data.cancellationRate}%`, icon: '❌', desc: data.cancellationRate > 20 ? 'Needs attention' : 'Healthy' },
    { label: 'Completed', value: data.completedBookings, icon: '✅', desc: 'Total completed' },
  ];

  const tooltipStyle = {
    backgroundColor: '#1F2937',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
  };

  return (
    <div>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <div className="flex bg-gray-100 dark:bg-dark-card rounded-lg p-1">
            {[
              { key: '7d', label: '7D' },
              { key: '30d', label: '30D' },
              { key: '12m', label: '12M' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeRange(t.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  timeRange === t.key
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
          >
            <HiOutlineRefresh size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn-primary text-sm py-2 px-3 flex items-center gap-1.5"
          >
            <HiOutlineDownload size={16} />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Report content (captured for PDF) */}
      <div ref={reportRef} className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bgLight}`}>
                  <card.icon size={20} className={card.textColor} />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.textColor}`}>{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{card.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-[11px] text-gray-400 mt-1">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Row 1: Revenue + Daily Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Monthly Revenue Trend</h3>
              <span className="text-xs text-gray-400">Last 12 months</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.monthlyRevenue}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Bookings Trend */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Daily Bookings</h3>
              <span className="text-xs text-gray-400">Last 30 days</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.dailyBookings}>
                <defs>
                  <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} fill="url(#bookingGrad)" name="Bookings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Slot Occupancy + Booking Status + Peak Hours */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Slot Occupancy Donut */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Slot Occupancy</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={slotChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {slotChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center -mt-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.occupancyRate}%</p>
              <p className="text-xs text-gray-500">Current Occupancy</p>
            </div>
          </div>

          {/* Booking Status Distribution */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Booking Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.bookingStatusDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.bookingStatusDist?.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {data.bookingStatusDist?.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] || '#6B7280' }} />
                  <span className="text-[11px] text-gray-600 dark:text-gray-400">{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Peak Hours</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(h) => `${h}:00`} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(h) => `${h}:00`} />
                <Bar dataKey="count" name="Bookings" radius={[4, 4, 0, 0]}>
                  {data.peakHours?.map((entry, index) => (
                    <Cell key={index} fill={entry.count === Math.max(...data.peakHours.map((p) => p.count)) ? '#EF4444' : '#8B5CF6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Popular Lots + User Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Parking Lots */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Top Parking Lots by Bookings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.popularLots} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [name === 'revenue' ? formatCurrency(v) : v, name === 'revenue' ? 'Revenue' : 'Bookings']} />
                <Legend iconType="circle" />
                <Bar dataKey="bookings" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Bookings" />
                <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* User Growth */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="users" stroke="#EC4899" strokeWidth={2} fill="url(#userGrad)" name="New Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 4: Weekly Bookings + Revenue by Lot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Bookings */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Weekly Bookings</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.weeklyBookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Bookings" fill="#06B6D4" radius={[4, 4, 0, 0]}>
                  {data.weeklyBookings?.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Lot — Pie */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Revenue by Parking Lot</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.revenueByLot}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="revenue"
                  nameKey="name"
                  label={({ name, percent }) => `${name?.slice(0, 12)} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.revenueByLot?.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recent Bookings</h3>
            <span className="text-xs text-gray-400">Last 15 bookings</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-border">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Parking Lot</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Slot</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBookings?.map((b) => (
                  <tr key={b._id} className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/20 transition-colors">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-xs">{b.userId?.name || 'N/A'}</p>
                        <p className="text-[10px] text-gray-400">{b.userId?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300">
                      {b.parkingLotId?.name || 'N/A'}
                      {b.parkingLotId?.city && <span className="text-gray-400 ml-1">({b.parkingLotId.city})</span>}
                    </td>
                    <td className="py-3 px-2 text-xs font-mono text-gray-600 dark:text-gray-400">{b.slotId?.slotNumber || 'N/A'}</td>
                    <td className="py-3 px-2 text-xs text-gray-600 dark:text-gray-400">{formatDateTime(b.startTime)}</td>
                    <td className="py-3 px-2 text-xs text-gray-600 dark:text-gray-400">{b.duration} hrs</td>
                    <td className="py-3 px-2 text-xs font-bold text-primary-600">{formatCurrency(b.totalAmount)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        b.bookingStatus === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        b.bookingStatus === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        b.bookingStatus === 'completed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data.recentBookings || data.recentBookings.length === 0) && (
              <div className="text-center py-8 text-gray-500 text-sm">No recent bookings</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
