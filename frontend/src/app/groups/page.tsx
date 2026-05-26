'use client';

import { useState } from 'react';
import {
  Plus,
  Users,
  Search,
  MoreHorizontal,
  FileText,
  BookOpen,
  Pencil,
  Trash2,
  X,
  GraduationCap,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Group {
  id: string;
  name: string;
  subject: string;
  grade: string;
  studentCount: number;
  assignmentCount: number;
  color: string;
  createdAt: string;
}

// ─── Seed demo data ────────────────────────────────────────────────────────────
const DEMO_GROUPS: Group[] = [
  { id: '1', name: 'Class 10 — Science', subject: 'Science', grade: 'Grade 10', studentCount: 34, assignmentCount: 5, color: '#D4521A', createdAt: '2025-01-10' },
  { id: '2', name: 'Class 9 — Mathematics', subject: 'Mathematics', grade: 'Grade 9', studentCount: 38, assignmentCount: 3, color: '#0F766E', createdAt: '2025-01-14' },
  { id: '3', name: 'Class 8 — English', subject: 'English', grade: 'Grade 8', studentCount: 30, assignmentCount: 2, color: '#7C3AED', createdAt: '2025-01-18' },
  { id: '4', name: 'Class 10 — Social Studies', subject: 'Social Studies', grade: 'Grade 10', studentCount: 36, assignmentCount: 4, color: '#0369A1', createdAt: '2025-01-22' },
];

// ─── Group Card ────────────────────────────────────────────────────────────────
function GroupCard({
  group,
  onDelete,
}: {
  group: Group;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = group.name
    .split('—')
    .map((s) => s.trim()[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white rounded-[14px] border border-veda-gray-200 p-5 hover:shadow-card-hover transition-all duration-200 group relative">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-[10px] flex items-center justify-center text-white font-bold text-[13px] shrink-0"
            style={{ backgroundColor: group.color }}
          >
            {initials}
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-veda-gray-900 leading-tight">{group.name}</h3>
            <p className="text-[11.5px] text-veda-gray-400 mt-0.5">{group.grade}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center text-veda-gray-400 hover:text-veda-gray-700 hover:bg-veda-gray-100 transition-all"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white rounded-[10px] border border-veda-gray-200 shadow-float py-1 w-40 animate-fade-in">
                <button className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[12.5px] text-veda-gray-700 hover:bg-veda-gray-50 transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-veda-gray-400" />
                  Edit Group
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(group.id); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[12.5px] text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Group
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-[12px] text-veda-gray-500">
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold text-veda-gray-900">{group.studentCount}</span> students
        </div>
        <div className="w-px h-4 bg-veda-gray-200" />
        <div className="flex items-center gap-1.5 text-[12px] text-veda-gray-500">
          <FileText className="w-3.5 h-3.5" />
          <span className="font-semibold text-veda-gray-900">{group.assignmentCount}</span> assignments
        </div>
      </div>

      {/* Subject badge */}
      <div className="flex items-center justify-between pt-3 border-t border-veda-gray-100">
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: group.color + '18', color: group.color }}
        >
          {group.subject}
        </span>
        <span className="text-[11px] text-veda-gray-400">
          Since {new Date(group.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

// ─── Create Group Modal ────────────────────────────────────────────────────────
function CreateGroupModal({ onClose, onCreate }: { onClose: () => void; onCreate: (g: Group) => void }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !subject.trim() || !grade.trim()) return;
    const colors = ['#D4521A', '#0F766E', '#7C3AED', '#0369A1', '#B45309', '#DC2626'];
    onCreate({
      id: Date.now().toString(),
      name: name.trim(),
      subject: subject.trim(),
      grade: grade.trim(),
      studentCount: 0,
      assignmentCount: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      createdAt: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[20px] w-full max-w-[420px] shadow-float animate-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-veda-gray-100">
          <h2 className="text-[15px] font-bold text-veda-gray-900">Create New Group</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-veda-gray-100 flex items-center justify-center hover:bg-veda-gray-200 transition-all">
            <X className="w-3.5 h-3.5 text-veda-gray-600" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-veda-gray-700 mb-1.5">Group Name <span className="text-veda-orange">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 10 — Science"
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-veda-gray-200 text-[13.5px] text-veda-gray-800 placeholder:text-veda-gray-400 focus:border-veda-orange/60 focus:ring-2 focus:ring-veda-orange/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-veda-gray-700 mb-1.5">Subject <span className="text-veda-orange">*</span></label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics"
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-veda-gray-200 text-[13.5px] text-veda-gray-800 placeholder:text-veda-gray-400 focus:border-veda-orange/60 focus:ring-2 focus:ring-veda-orange/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-veda-gray-700 mb-1.5">Grade <span className="text-veda-orange">*</span></label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-veda-gray-200 text-[13.5px] text-veda-gray-800 focus:border-veda-orange/60 focus:ring-2 focus:ring-veda-orange/10 transition-all bg-white"
            >
              <option value="">Select grade…</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={`Grade ${g}`}>Grade {g}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-veda-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-[10px] border border-veda-gray-200 text-[13px] font-medium text-veda-gray-600 hover:bg-veda-gray-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !subject.trim() || !grade.trim()}
            className="flex-1 py-2.5 rounded-[10px] bg-veda-black text-white text-[13px] font-semibold hover:bg-[#2A2A2A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>(DEMO_GROUPS);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (!confirm('Delete this group?')) return;
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-[1100px] mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-veda-gray-900 tracking-tight mb-1">My Groups</h1>
            <p className="text-[13.5px] text-veda-gray-500">Organise students into classes and assign work</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-veda-black text-white text-[13px] font-medium rounded-[10px] hover:bg-[#2A2A2A] transition-all active:scale-[0.97] shrink-0"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            New Group
          </button>
        </div>

        {/* Search */}
        {groups.length > 0 && (
          <div className="relative max-w-[320px] mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-veda-gray-400" />
            <input
              type="text"
              placeholder="Search groups…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-[8px] border border-veda-gray-200 bg-white text-[13px] text-veda-gray-700 placeholder:text-veda-gray-400 focus:border-veda-orange/50 focus:ring-2 focus:ring-veda-orange/10 transition-all"
            />
          </div>
        )}

        {/* Empty state */}
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-veda-gray-100 flex items-center justify-center mb-4">
              <GraduationCap className="w-7 h-7 text-veda-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-[15px] font-bold text-veda-gray-900 mb-1">No groups yet</h3>
            <p className="text-[13px] text-veda-gray-500 mb-5 max-w-[260px]">
              Create your first group to organise students and assign papers
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-veda-black text-white text-[13px] font-medium rounded-[10px] hover:bg-[#2A2A2A] transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Create First Group
            </button>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filtered.map((group) => (
              <GroupCard key={group.id} group={group} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* No search results */}
        {groups.length > 0 && filtered.length === 0 && (
          <p className="text-center py-16 text-veda-gray-400 text-[13.5px]">
            No groups match &quot;{search}&quot;
          </p>
        )}

        {/* Stats bar at bottom */}
        {groups.length > 0 && (
          <div className="flex items-center gap-6 mt-6 pt-5 border-t border-veda-gray-200">
            <div className="flex items-center gap-2 text-[12.5px] text-veda-gray-500">
              <Users className="w-4 h-4 text-veda-gray-400" />
              <span className="font-semibold text-veda-gray-900">{groups.length}</span> total groups
            </div>
            <div className="flex items-center gap-2 text-[12.5px] text-veda-gray-500">
              <BookOpen className="w-4 h-4 text-veda-gray-400" />
              <span className="font-semibold text-veda-gray-900">
                {groups.reduce((s, g) => s + g.studentCount, 0)}
              </span> students
            </div>
            <div className="flex items-center gap-2 text-[12.5px] text-veda-gray-500">
              <FileText className="w-4 h-4 text-veda-gray-400" />
              <span className="font-semibold text-veda-gray-900">
                {groups.reduce((s, g) => s + g.assignmentCount, 0)}
              </span> assignments
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onCreate={(g) => setGroups((prev) => [g, ...prev])}
        />
      )}
    </MainLayout>
  );
}
