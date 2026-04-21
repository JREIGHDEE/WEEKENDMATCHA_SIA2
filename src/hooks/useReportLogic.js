import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useReportLogic(setNotification) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [printData, setPrintData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Dynamic Form State
  const [reportForm, setReportForm] = useState({
    reportType: 'Daily Sales',
    dailyDate: '',
    weeklyDate: '',
    monthlyDate: '',
    rangeFrom: '',   // <-- ADD THIS
    rangeTo: ''      // <-- ADD THIS
  });

  // Stores the calculated start/end dates for the DB query
  const [calculatedRange, setCalculatedRange] = useState({ from: '', to: '', display: '' });

  async function fetchReportHistory() {
    setLoading(true);
    const { data, error } = await supabase
      .from('Report')
      .select(`*, Employee(User(FirstName, LastName))`)
      .order('DateGenerated', { ascending: false });
    if (!error) setReportHistory(data);
    setLoading(false);
  }

  useEffect(() => { fetchReportHistory(); }, []);

  // --- STRICT DATE CALCULATORS ---
  const getWeekRange = (weekStr) => {
    const year = parseInt(weekStr.substring(0, 4));
    const week = parseInt(weekStr.substring(6, 8));
    const jan4 = new Date(year, 0, 4);
    const start = new Date(year, 0, 4 - (jan4.getDay() || 7) + ((week - 1) * 7) + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  const getMonthRange = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const start = `${monthStr}-01`;
    const end = new Date(year, parseInt(month), 0).toISOString().split('T')[0];
    return { start, end };
  };

  // --- PREPARATION STEP ---
  const prepareReport = () => {
    let from = '', to = '', display = '';

    if (reportForm.reportType === 'Daily Sales') {
      if (!reportForm.dailyDate) return false;
      from = reportForm.dailyDate;
      to = reportForm.dailyDate;
      display = new Date(from).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else if (reportForm.reportType === 'Weekly Sales') {
      if (!reportForm.weeklyDate) return false;
      const range = getWeekRange(reportForm.weeklyDate);
      from = range.start;
      to = range.end;
      display = `Week of ${new Date(from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (reportForm.reportType === 'Monthly Sales') {
      if (!reportForm.monthlyDate) return false;
      const range = getMonthRange(reportForm.monthlyDate);
      from = range.start;
      to = range.end;
      display = new Date(from).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (reportForm.reportType === 'Custom Range') {
      if (!reportForm.rangeFrom || !reportForm.rangeTo) return false;
      from = reportForm.rangeFrom;
      to = reportForm.rangeTo;
      display = `${new Date(from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to ${new Date(to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    setCalculatedRange({ from, to, display });
    return true;
  };

  const handleConfirmSavePdf = async () => {
    setLoading(true);
    setShowConfirmModal(false);

    try {
      const { data: records, error: fetchErr } = await supabase
        .from('FinancialRecord')
        .select('*')
        .gte('TransactionDate', calculatedRange.from + 'T00:00:00')
        .lte('TransactionDate', calculatedRange.to + 'T23:59:59')
        .neq('Status', 'Archived')
        .order('TransactionDate', { ascending: true });

      if (fetchErr) throw fetchErr;
      setPrintData(records);

      const { data: { user } } = await supabase.auth.getUser();
      let empId = 1;
      if (user) {
         const { data: emp } = await supabase.from('Employee').select('EmployeeID').eq('UserID', user.id).maybeSingle();
         if (emp) empId = emp.EmployeeID;
      }

      const { error: insertErr } = await supabase.from('Report').insert([{
        EmployeeID: empId,
        ReportType: reportForm.reportType,
        DateGenerated: new Date().toISOString(),
        DateRangeFrom: calculatedRange.from,
        DateRangeTo: calculatedRange.to,
        FilePath: 'Local Print'
      }]);

      if(insertErr) throw insertErr;

      setTimeout(() => {
        window.print();
        
        setPrintData([]);
        fetchReportHistory();
        setReportForm({ reportType: 'Daily Sales', dailyDate: '', weeklyDate: '', monthlyDate: '', rangeFrom: '', rangeTo: '' });
      }, 800);

    } catch (err) {
      if (setNotification) setNotification({ message: "Error: " + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return {
    state: { showGenerateModal, showConfirmModal, reportHistory, printData, loading, searchTerm, reportForm, calculatedRange },
    actions: { setShowGenerateModal, setShowConfirmModal, setSearchTerm, setReportForm, handleConfirmSavePdf, fetchReportHistory, prepareReport }
  };
}