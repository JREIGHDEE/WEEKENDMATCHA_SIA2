import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useReportLogic(setNotification) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [printData, setPrintData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal and Data states for viewing historical snapshots
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReportData, setSelectedReportData] = useState(null);

  // 1. Dynamic Form State
  const [reportForm, setReportForm] = useState({
    reportType: 'Daily Sales',
    dailyDate: '',
    weeklyDate: '',
    monthlyDate: '',
    rangeFrom: '',   
    rangeTo: ''      
  });

  // Stores the calculated start/end dates for the DB query
  const [calculatedRange, setCalculatedRange] = useState({ from: '', to: '', display: '' });

  async function fetchReportHistory() {
    setLoading(true);
    const { data, error } = await supabase
      .from('Report')
      .select(`*, Employee(User(FirstName, LastName))`)
      .order('ReportID', { ascending: false });
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

  // --- EXECUTION STEP ---
  const handleConfirmSavePdf = async () => {
    setLoading(true);
    setShowConfirmModal(false);

    try {
      // 1. Fetch exact range from Financial Records
      const { data: records, error: fetchErr } = await supabase
        .from('FinancialRecord')
        .select('*')
        .gte('TransactionDate', calculatedRange.from + 'T00:00:00')
        .lte('TransactionDate', calculatedRange.to + 'T23:59:59')
        .neq('Status', 'Archived')
        .order('TransactionDate', { ascending: true });

      if (fetchErr) throw fetchErr;
      setPrintData(records);

      // 2. Identify User (With bulletproof fallback)
      const { data: { user } } = await supabase.auth.getUser();
      let empId = null;
      if (user) {
         const { data: emp } = await supabase.from('Employee').select('EmployeeID').eq('UserID', user.id).maybeSingle();
         if (emp) empId = emp.EmployeeID;
      }

      if (!empId) {
          const { data: fallbackEmp } = await supabase.from('Employee').select('EmployeeID').limit(1).single();
          if (fallbackEmp) {
              empId = fallbackEmp.EmployeeID;
          } else {
              throw new Error("No employees found in the database to assign this report to.");
          }
      }

      // 3. Save Report AND Return the ID
      const { data: insertedReport, error: insertErr } = await supabase.from('Report').insert([{
        EmployeeID: empId,
        ReportType: reportForm.reportType,
        DateGenerated: new Date().toISOString(),
        TimeGenerated: new Date().toTimeString().split(' ')[0], // <-- ADDS EXACT HH:MM:SS TO NEW COLUMN
        DateRangeFrom: calculatedRange.from,
        DateRangeTo: calculatedRange.to,
        FilePath: 'Local Print'
      }]).select().single();

      if(insertErr) throw insertErr;

      // 4. Staple the records to the ReportDetails junction table
      if (insertedReport && records.length > 0) {
        const detailsPayload = records.map((record) => ({
          ReportID: insertedReport.ReportID,
          RecordID: record.RecordID
        }));

        const { error: detailsErr } = await supabase.from('ReportDetails').insert(detailsPayload);
        if (detailsErr) console.error("Error saving report details:", detailsErr);
      }

      // 5. Trigger Print Dialog
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

  // --- RETRIEVAL STEP (View Past Snapshot) ---
  const fetchReportDetails = async (reportId) => {
    setLoading(true);
    try {
      // Fetch the junction table data AND the linked FinancialRecord data
      const { data, error } = await supabase
        .from('ReportDetails')
        .select(`
          RecordID,
          FinancialRecord (*)
        `)
        .eq('ReportID', reportId);

      if (error) throw error;

      // Clean up the data array so it's just a flat list of records
      const cleanRecords = data.map(item => item.FinancialRecord);
      
      setSelectedReportData(cleanRecords);
      setShowViewModal(true);
    } catch (err) {
      if (setNotification) setNotification({ message: "Error loading details: " + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: SEARCH FILTER LOGIC ---
  const filteredHistory = reportHistory.filter((report) => {
    if (!searchTerm) return true; // If search is empty, show all

    const lowerTerm = searchTerm.toLowerCase();

    // 1. Check ID (Formatted as RPT-001)
    const formattedID = `RPT-${String(report.ReportID).padStart(3, '0')}`.toLowerCase();
    
    // 2. Check Generated By (Safely combine First and Last name)
    const generatedBy = `${report.Employee?.User?.FirstName || ''} ${report.Employee?.User?.LastName || ''}`.toLowerCase();
    
    // 3. Check Type
    const type = (report.ReportType || '').toLowerCase();
    
    // 4. Check Date Generated (Formatted to match your new readable UI format)
    const formattedDate = new Date(report.DateGenerated).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toLowerCase();

    // Return true if the search term exists in ANY of these fields
    return formattedID.includes(lowerTerm) || 
           generatedBy.includes(lowerTerm) || 
           type.includes(lowerTerm) || 
           formattedDate.includes(lowerTerm);
  });

  // 6. Ensure all new states and functions are exported!
  return {
    // ADD filteredHistory to the state object here:
    state: { showGenerateModal, showConfirmModal, showViewModal, selectedReportData, reportHistory, filteredHistory, printData, loading, searchTerm, reportForm, calculatedRange },
    actions: { setShowGenerateModal, setShowConfirmModal, setShowViewModal, setSearchTerm, setReportForm, handleConfirmSavePdf, fetchReportHistory, prepareReport, fetchReportDetails }
  };
}