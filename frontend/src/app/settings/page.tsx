'use client';

import { useState } from 'react';
import {
  User,
  School,
  Bell,
  Palette,
  Shield,
  ChevronRight,
  Check,
  Sparkles,
  Save,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-[9px] bg-veda-orange-light flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-veda-orange" strokeWidth={2} />
      </div>
      <div>
        <h2 className="text-[14px] font-bold text-veda-gray-900">{title}</h2>
        <p className="text-[12px] text-veda-gray-500">{description}</p>
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-veda-gray-100 last:border-0 gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-veda-gray-800">{label}</p>
        {description && <p className="text-[11.5px] text-veda-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn(
        'relative w-9 h-5 rounded-full transition-all duration-200',
        on ? 'bg-veda-orange' : 'bg-veda-gray-200'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200',
          on ? 'left-[calc(100%-18px)]' : 'left-0.5'
        )}
      />
    </button>
  );
}

function SettingInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-[220px] px-3 py-2 rounded-[8px] border border-veda-gray-200 text-[13px] text-veda-gray-800 placeholder:text-veda-gray-400 focus:border-veda-orange/60 focus:ring-2 focus:ring-veda-orange/10 transition-all bg-white"
    />
  );
}

export default function SettingsPage() {
  // Profile state
  const [schoolName, setSchoolName] = useState('Delhi Public School');
  const [teacherName, setTeacherName] = useState('Rajesh Kumar');
  const [email, setEmail] = useState('rajesh.kumar@dpsbokaro.edu.in');
  const [city, setCity] = useState('Bokaro Steel City');

  // Notification prefs
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [genComplete, setGenComplete] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // AI prefs
  const [aiProvider, setAiProvider] = useState('gemini');
  const [difficultyMix, setDifficultyMix] = useState('balanced');

  // Saved toast
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-[780px] mx-auto">

        <div className="mb-8">
          <h1 className="text-[22px] font-bold text-veda-gray-900 tracking-tight mb-1">Settings</h1>
          <p className="text-[13.5px] text-veda-gray-500">Manage your profile, preferences, and account</p>
        </div>

        <div className="space-y-6">

          <div className="bg-white rounded-[16px] border border-veda-gray-200 p-6">
            <SectionHeader icon={School} title="School Profile" description="Your institution's details shown on generated papers" />

            <div className="space-y-0 divide-y divide-veda-gray-100">
              <SettingRow label="School Name" description="Appears in the header of every generated paper">
                <SettingInput value={schoolName} onChange={setSchoolName} placeholder="School name" />
              </SettingRow>
              <SettingRow label="Teacher Name" description="Primary account holder">
                <SettingInput value={teacherName} onChange={setTeacherName} placeholder="Your name" />
              </SettingRow>
              <SettingRow label="Email Address" description="Used for account notifications">
                <SettingInput value={email} onChange={setEmail} placeholder="you@school.edu" />
              </SettingRow>
              <SettingRow label="City / Location">
                <SettingInput value={city} onChange={setCity} placeholder="City" />
              </SettingRow>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-veda-gray-200 p-6">
            <SectionHeader icon={Sparkles} title="AI Preferences" description="Control how VedaAI generates your exam papers" />

            <div className="space-y-0">

              <SettingRow label="AI Provider" description="Choose which AI model powers paper generation">
                <div className="flex items-center gap-2">
                  {[
                    { value: 'gemini', label: 'Gemini (Free)' },
                    { value: 'claude', label: 'Claude' },
                    { value: 'mock', label: 'Mock / Demo' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAiProvider(opt.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-[7px] text-[12px] font-medium border transition-all',
                        aiProvider === opt.value
                          ? 'bg-veda-orange text-white border-veda-orange'
                          : 'bg-white text-veda-gray-600 border-veda-gray-200 hover:border-veda-gray-300'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Default Difficulty Mix" description="How questions are distributed by difficulty">
                <div className="flex items-center gap-2">
                  {[
                    { value: 'easy', label: 'Easy Focus' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'hard', label: 'Hard Focus' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDifficultyMix(opt.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-[7px] text-[12px] font-medium border transition-all',
                        difficultyMix === opt.value
                          ? 'bg-veda-black text-white border-veda-black'
                          : 'bg-white text-veda-gray-600 border-veda-gray-200 hover:border-veda-gray-300'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </SettingRow>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-veda-gray-200 p-6">
            <SectionHeader icon={Bell} title="Notifications" description="Control what VedaAI notifies you about" />

            <div className="space-y-0">
              <SettingRow label="Email Notifications" description="Receive important updates by email">
                <Toggle on={emailNotifs} onChange={setEmailNotifs} />
              </SettingRow>
              <SettingRow label="Generation Complete" description="Alert when a paper finishes generating">
                <Toggle on={genComplete} onChange={setGenComplete} />
              </SettingRow>
              <SettingRow label="Weekly Digest" description="Summary of assignments and activity each week">
                <Toggle on={weeklyDigest} onChange={setWeeklyDigest} />
              </SettingRow>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-veda-gray-200 p-6">
            <SectionHeader icon={Shield} title="Account & Security" description="Manage account security settings" />

            <div className="space-y-0">
              <SettingRow label="Change Password" description="Update your login credentials">
                <button className="flex items-center gap-1.5 text-[12.5px] font-medium text-veda-orange hover:text-veda-orange-hover transition-colors">
                  Update <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </SettingRow>
              <SettingRow label="Two-Factor Authentication" description="Add an extra layer of security">
                <button className="flex items-center gap-1.5 text-[12.5px] font-medium text-veda-gray-500 hover:text-veda-gray-800 transition-colors">
                  Set up <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </SettingRow>
              <SettingRow label="Delete Account" description="Permanently remove your account and all data">
                <button className="text-[12.5px] font-medium text-red-500 hover:text-red-600 transition-colors">
                  Delete account
                </button>
              </SettingRow>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-veda-gray-200 p-6">
            <SectionHeader icon={Palette} title="Appearance" description="Customise how VedaAI looks" />
            <div className="flex items-center gap-3 py-2">
              {[
                { label: 'Light', class: 'bg-white border-2 border-veda-gray-300' },
                { label: 'Dark (soon)', class: 'bg-veda-black opacity-40 cursor-not-allowed border-2 border-transparent' },
              ].map(({ label, class: cls }) => (
                <div key={label} className="text-center">
                  <div className={cn('w-16 h-10 rounded-[8px] mb-1.5', cls)} />
                  <p className="text-[11px] text-veda-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-veda-gray-200">
          <p className="text-[12px] text-veda-gray-400">Changes are applied immediately after saving.</p>
          <button
            onClick={handleSave}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all active:scale-[0.97]',
              saved
                ? 'bg-green-600 text-white'
                : 'bg-veda-black text-white hover:bg-[#2A2A2A]'
            )}
          >
            {saved ? (
              <><Check className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>

      </div>
    </MainLayout>
  );
}
