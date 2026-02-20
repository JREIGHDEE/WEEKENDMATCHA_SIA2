import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useReportLogic() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [printData, setPrintData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportForm, setReportForm] = useState({ dateFrom: '', dateTo: '', reportType: 'Daily Sales' });

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

  const handleConfirmSavePdf = async () => {
    setLoading(true);
    setShowConfirmModal(false);
    try {
      const { data: records, error: fetchErr } = await supabase
        .from('FinancialRecord')
        .select('*')
        .gte('TransactionDate', reportForm.dateFrom)
        .lte('TransactionDate', reportForm.dateTo + 'T23:59:59')
        .neq('Status', 'Archived');

      if (fetchErr) throw fetchErr;
      setPrintData(records);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: emp } = await supabase.from('Employee').select('EmployeeID').eq('UserID', user.id).maybeSingle();

      await supabase.from('Report').insert([{
        EmployeeID: emp?.EmployeeID || 1,
        ReportType: reportForm.reportType,
        DateGenerated: new Date().toISOString(),
        DateRangeFrom: reportForm.dateFrom,
        DateRangeTo: reportForm.dateTo,
        FilePath: 'Local Download'
      }]);

      setTimeout(() => {
        window.print();
        setPrintData([]);
        fetchReportHistory();
      }, 800);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
      setReportForm({ dateFrom: '', dateTo: '', reportType: 'Daily Sales' });
    }
  };

  return {
    state: { showGenerateModal, showConfirmModal, reportHistory, printData, loading, searchTerm, reportForm },
    actions: { setShowGenerateModal, setShowConfirmModal, setSearchTerm, setReportForm, handleConfirmSavePdf, fetchReportHistory }
  };
}