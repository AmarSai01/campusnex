import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Building2,
  Camera,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  UserRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import { Button } from '@/components/ui/button';

const PHONE_PATTERN = /^[0-9+() -]{7,20}$/;

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900 break-words">{value || '—'}</dd>
    </div>
  );
}

function Photo({ url, name, size = 'h-20 w-20 text-2xl' }) {
  return url ? (
    <img src={url} alt="" className={`${size} rounded-2xl object-cover border border-slate-200 shrink-0`} />
  ) : (
    <div
      aria-hidden="true"
      className={`${size} rounded-2xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center font-extrabold shrink-0`}
    >
      {(name || '?').slice(0, 1).toUpperCase()}
    </div>
  );
}

// The signed-in student's own record, courses and department contacts. Students can change
// only their phone number and photo; everything else is kept by the college.
export default function MyProfile() {
  const { currentUser } = useAuth();
  const { courses, enrollments, users, departments, updateMyContact, uploadProfilePhoto, deleteProfilePhoto } =
    useData();

  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInput = useRef(null);

  // Revoke the local preview link when it is replaced or the page closes.
  useEffect(() => () => photoPreview && URL.revokeObjectURL(photoPreview), [photoPreview]);

  if (!currentUser) return null;

  const department = departments.find((d) => d.id === currentUser.department_id);
  const hod = department?.head_faculty_id ? users.find((u) => u.id === department.head_faculty_id) : null;
  const myCourseIds = new Set(enrollments.filter((e) => e.student_id === currentUser.id).map((e) => e.course_id));
  const myCourses = courses.filter((c) => myCourseIds.has(c.id)).sort((a, b) => a.code.localeCompare(b.code));
  const totalCredits = myCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

  const shownPhoto = photoPreview || (removePhoto ? null : currentUser.photo_url);
  const phoneTrimmed = phone.trim();
  const phoneInvalid = phoneTrimmed !== '' && !PHONE_PATTERN.test(phoneTrimmed);
  const dirty = phoneTrimmed !== (currentUser.phone || '') || !!photoFile || removePhoto;

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Use a JPG, PNG or WebP image.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'The photo must be 2 MB or smaller.' });
      return;
    }
    setMessage(null);
    setPhotoFile(file);
    setRemovePhoto(false);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(!!currentUser.photo_url);
  };

  const save = async (e) => {
    e.preventDefault();
    if (phoneInvalid || !dirty || saving) return;
    setSaving(true);
    setMessage(null);
    const oldPhoto = currentUser.photo_url;
    let uploaded = null;
    try {
      uploaded = photoFile ? await uploadProfilePhoto(photoFile) : null;
      const nextPhoto = uploaded || (removePhoto ? null : oldPhoto);
      await updateMyContact({ phone: phoneTrimmed, photo_url: nextPhoto });
      if (oldPhoto && oldPhoto !== nextPhoto) deleteProfilePhoto(oldPhoto).catch(() => {});
      setPhotoFile(null);
      setPhotoPreview(null);
      setRemovePhoto(false);
      setMessage({ type: 'success', text: 'Your contact details are saved.' });
    } catch (err) {
      // Don't leave an unused upload behind when saving the profile failed.
      if (uploaded) deleteProfilePhoto(uploaded).catch(() => {});
      setMessage({ type: 'error', text: err.message || 'Could not save your details.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center gap-5">
        <Photo url={shownPhoto} name={currentUser.name} />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{currentUser.name}</h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 break-all">
            <Mail className="w-3.5 h-3.5 shrink-0" /> {currentUser.email}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {currentUser.usn && <Badge variant="primary">{currentUser.usn}</Badge>}
            {currentUser.semester && <Badge variant="neutral">Semester {currentUser.semester}</Badge>}
            {currentUser.section && <Badge variant="neutral">Section {currentUser.section}</Badge>}
            {department && <Badge variant="info">{department.code}</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <IdCard className="w-4 h-4 text-brand-600" /> Academic record
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Kept by your college. Ask your department office if anything here is wrong.
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <Detail label="Full name" value={currentUser.name} />
            <Detail label="USN" value={currentUser.usn} />
            <Detail label="Roll number" value={currentUser.roll_no} />
            <Detail label="Department" value={department ? `${department.name} (${department.code})` : null} />
            <Detail label="Semester" value={currentUser.semester} />
            <Detail label="Section" value={currentUser.section} />
            <Detail label="College email" value={currentUser.email} />
            <Detail label="Account" value={currentUser.status === 'inactive' ? 'Inactive' : 'Active'} />
          </dl>
        </div>

        <form
          onSubmit={save}
          className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col"
        >
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserRound className="w-4 h-4 text-brand-600" /> Contact & photo
          </h3>
          <p className="text-xs text-slate-500 mb-5">Your teachers and HOD see these.</p>

          <div className="flex items-center gap-4 mb-5">
            <Photo url={shownPhoto} name={currentUser.name} size="h-14 w-14 text-lg" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => fileInput.current?.click()}>
                <Camera className="w-3.5 h-3.5" /> {shownPhoto ? 'Change photo' : 'Add photo'}
              </Button>
              {shownPhoto && (
                <Button type="button" variant="ghost" size="sm" className="rounded-xl text-rose-600" onClick={clearPhoto}>
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                tabIndex={-1}
                aria-label="Choose a profile photo"
                onChange={pickPhoto}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 -mt-3 mb-5">JPG, PNG or WebP, up to 2 MB.</p>

          <label htmlFor="profile-phone" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Phone number
          </label>
          <input
            id="profile-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            aria-invalid={phoneInvalid}
            aria-describedby="profile-phone-hint"
            className="mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none aria-invalid:border-rose-400"
          />
          <p id="profile-phone-hint" className={`text-[11px] mt-1 ${phoneInvalid ? 'text-rose-600' : 'text-slate-400'}`}>
            {phoneInvalid ? 'Use 7 to 20 digits; spaces, +, - and brackets are fine.' : 'Leave empty to remove it.'}
          </p>

          {message && (
            <p
              role={message.type === 'error' ? 'alert' : 'status'}
              className={`mt-4 rounded-xl px-3 py-2 text-xs font-semibold ${
                message.type === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {message.text}
            </p>
          )}

          <Button type="submit" className="mt-5 rounded-xl self-start" disabled={!dirty || phoneInvalid || saving}>
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 pb-4 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" /> My courses
              </h3>
              <p className="text-xs text-slate-500">
                {myCourses.length} course{myCourses.length === 1 ? '' : 's'} this semester
                {totalCredits > 0 && ` · ${totalCredits} credits`}
              </p>
            </div>
          </div>
          {myCourses.length === 0 ? (
            <p className="px-6 pb-6 text-xs text-slate-400">You are not enrolled in any courses yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {myCourses.map((c) => {
                const teacher = users.find((u) => u.id === c.faculty_id);
                return (
                  <li key={c.id} className="px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color || '#4f46e5' }} />
                      <span className="font-bold text-xs text-slate-900">{c.code}</span>
                      <span className="text-xs text-slate-600 truncate">{c.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 sm:w-44 truncate">{teacher?.name || 'Teacher not assigned'}</span>
                    <span className="text-[11px] font-bold text-slate-700 sm:w-16 sm:text-right">
                      {c.credits ? `${c.credits} cr` : '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" /> Department contact
          </h3>
          <p className="text-xs text-slate-500 mb-5">{department ? department.name : 'No department set on your record.'}</p>
          {hod ? (
            <div className="flex items-start gap-3">
              <Photo url={hod.photo_url} name={hod.name} size="h-12 w-12 text-base" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  {hod.name}
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" aria-label="Head of Department" />
                </p>
                <p className="text-[11px] font-semibold text-brand-600">Head of Department</p>
                {hod.email && (
                  <a href={`mailto:${hod.email}`} className="text-xs text-slate-600 hover:text-brand-600 flex items-center gap-1.5 break-all">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {hod.email}
                  </a>
                )}
                {hod.phone && (
                  <a href={`tel:${hod.phone}`} className="text-xs text-slate-600 hover:text-brand-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {hod.phone}
                  </a>
                )}
                {hod.office && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {hod.office}
                  </p>
                )}
              </div>
            </div>
          ) : (
            department && <p className="text-xs text-slate-400">No HOD assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
