import { useState, useEffect } from 'react';
import { applicationAPI } from '../../services/api';
import { Application, ApplicationStatus } from '../../types';
import { ClipboardList, Plus, Edit3, Trash2, X, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const STATUS_COLORS: Record<string, string> = {
  Applied: 'badge-info', Interview: 'badge-warning', Offer: 'badge-success', Rejected: 'badge-danger',
};

export default function ApplicationTrackerPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ company: '', position: '', status: 'Applied', applied_date: new Date().toISOString().split('T')[0], notes: '' });

  const load = () => { applicationAPI.list().then(r => setApps(r.data)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleSave = async () => {
    try {
      if (editId) { await applicationAPI.update(editId, form); toast.success('Updated!'); }
      else { await applicationAPI.create(form); toast.success('Added!'); }
      setShowModal(false); setEditId(null); load();
    } catch { toast.error('Failed to save'); }
  };

  const handleEdit = (app: Application) => {
    setForm({ company: app.company, position: app.position, status: app.status, applied_date: app.applied_date, notes: app.notes || '' });
    setEditId(app.id); setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    try { await applicationAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const openNew = () => {
    setForm({ company: '', position: '', status: 'Applied', applied_date: new Date().toISOString().split('T')[0], notes: '' });
    setEditId(null); setShowModal(true);
  };

  const counts = { total: apps.length, applied: apps.filter(a => a.status === 'Applied').length, interview: apps.filter(a => a.status === 'Interview').length, offer: apps.filter(a => a.status === 'Offer').length, rejected: apps.filter(a => a.status === 'Rejected').length };

  return (
    <div className="animate-fade-in">
      <div className="dash-header flex-between">
        <div><h1 className="dash-title">Application Tracker</h1><p className="dash-subtitle">Track all your job applications</p></div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Add Application</button>
      </div>

      <div className="stats-row" style={{marginBottom:'var(--space-6)'}}>
        <div className="stat-card"><div className="stat-card-icon" style={{background:'var(--primary-soft)',color:'var(--primary)'}}><Briefcase size={20}/></div><div><p className="stat-card-num">{counts.total}</p><p className="stat-card-label">Total</p></div></div>
        <div className="stat-card"><div className="stat-card-icon" style={{background:'var(--primary-soft)',color:'var(--primary)'}}><ClipboardList size={20}/></div><div><p className="stat-card-num">{counts.applied}</p><p className="stat-card-label">Applied</p></div></div>
        <div className="stat-card"><div className="stat-card-icon" style={{background:'var(--accent-soft)',color:'var(--accent)'}}><ClipboardList size={20}/></div><div><p className="stat-card-num">{counts.interview}</p><p className="stat-card-label">Interview</p></div></div>
        <div className="stat-card"><div className="stat-card-icon" style={{background:'var(--success-soft)',color:'var(--success)'}}><ClipboardList size={20}/></div><div><p className="stat-card-num">{counts.offer}</p><p className="stat-card-label">Offers</p></div></div>
      </div>

      {apps.length === 0 && !loading ? (
        <div className="empty-state card"><ClipboardList size={48} className="empty-icon"/><h3>No applications yet</h3><p>Start tracking your job applications.</p><button className="btn btn-primary" onClick={openNew}><Plus size={18}/> Add First Application</button></div>
      ) : (
        <div className="app-table card" style={{padding:0,overflow:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'var(--text-sm)'}}>
            <thead><tr style={{borderBottom:'1px solid var(--border-light)',background:'var(--bg-tertiary)'}}>
              <th style={{padding:'12px 16px',textAlign:'left',fontWeight:600}}>Company</th>
              <th style={{padding:'12px 16px',textAlign:'left',fontWeight:600}}>Position</th>
              <th style={{padding:'12px 16px',textAlign:'left',fontWeight:600}}>Status</th>
              <th style={{padding:'12px 16px',textAlign:'left',fontWeight:600}}>Applied</th>
              <th style={{padding:'12px 16px',textAlign:'right',fontWeight:600}}>Actions</th>
            </tr></thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id} style={{borderBottom:'1px solid var(--border-light)'}}>
                  <td style={{padding:'12px 16px',fontWeight:600}}>{a.company}</td>
                  <td style={{padding:'12px 16px',color:'var(--text-secondary)'}}>{a.position}</td>
                  <td style={{padding:'12px 16px'}}><span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status}</span></td>
                  <td style={{padding:'12px 16px',color:'var(--text-tertiary)'}}>{a.applied_date}</td>
                  <td style={{padding:'12px 16px',textAlign:'right'}}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(a)}><Edit3 size={14}/></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(a.id)}><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit' : 'Add'} Application</h2><button className="btn-icon btn-ghost" onClick={() => setShowModal(false)}><X size={20}/></button></div>
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-4)'}}>
              <div className="input-group"><label>Company *</label><input className="input" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} /></div>
              <div className="input-group"><label>Position *</label><input className="input" value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))} /></div>
              <div className="input-group"><label>Status</label>
                <select className="select" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                  <option>Applied</option><option>Interview</option><option>Offer</option><option>Rejected</option>
                </select>
              </div>
              <div className="input-group"><label>Applied Date</label><input className="input" type="date" value={form.applied_date} onChange={e => setForm(f => ({...f, applied_date: e.target.value}))} /></div>
              <div className="input-group"><label>Notes</label><textarea className="textarea" rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
              <button className="btn btn-primary w-full" onClick={handleSave}>{editId ? 'Update' : 'Add'} Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
