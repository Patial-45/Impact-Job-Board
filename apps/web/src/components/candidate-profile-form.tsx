'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, SkillBadge } from '@executive-match/ui';
import type { CandidateProfileData } from '@/lib/api';
import {
  User,
  Briefcase,
  GraduationCap,
  Building2,
  Calendar,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Layers,
} from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function CandidateProfileForm({ initialProfile }: { initialProfile: CandidateProfileData }) {
  const router = useRouter();

  // Basic info state
  const [headline, setHeadline] = useState(initialProfile.headline || '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [location, setLocation] = useState(initialProfile.location || '');
  const [yearsOfExperience, setYearsOfExperience] = useState<number | string>(
    initialProfile.yearsOfExperience ?? '',
  );
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialProfile.websiteUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(initialProfile.githubUrl || '');
  const [searchVisible, setSearchVisible] = useState(initialProfile.searchVisible);
  const [openToRemote, setOpenToRemote] = useState(initialProfile.openToRemote);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Experience modal/form state
  const [experiences, setExperiences] = useState(initialProfile.experiences || []);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expCompany, setExpCompany] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [savingExp, setSavingExp] = useState(false);

  // Education state
  const [educations, setEducations] = useState(initialProfile.educations || []);
  const [showEduModal, setShowEduModal] = useState(false);
  const [eduInstitution, setEduInstitution] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduStartDate, setEduStartDate] = useState('');
  const [eduEndDate, setEduEndDate] = useState('');
  const [eduDescription, setEduDescription] = useState('');
  const [savingEdu, setSavingEdu] = useState(false);

  // Skills state
  const [skills, setSkills] = useState(initialProfile.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillYears, setNewSkillYears] = useState<number | string>('');
  const [newSkillPrimary, setNewSkillPrimary] = useState(false);
  const [savingSkill, setSavingSkill] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch(`${apiUrl}/candidates/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          headline,
          bio,
          location,
          yearsOfExperience: yearsOfExperience !== '' ? Number(yearsOfExperience) : null,
          phone,
          websiteUrl: websiteUrl || null,
          linkedinUrl: linkedinUrl || null,
          githubUrl: githubUrl || null,
          searchVisible,
          openToRemote,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      setProfileMessage({ text: 'Executive profile successfully updated.', type: 'success' });
      router.refresh();
    } catch {
      setProfileMessage({ text: 'Error saving profile. Please check all fields.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExp(true);

    try {
      const res = await fetch(`${apiUrl}/candidates/me/experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyName: expCompany,
          title: expTitle,
          location: expLocation || null,
          startDate: new Date(expStartDate).toISOString(),
          endDate: expEndDate && !expIsCurrent ? new Date(expEndDate).toISOString() : null,
          isCurrent: expIsCurrent,
          description: expDescription || null,
        }),
      });

      if (res.ok) {
        const newExp = await res.json();
        setExperiences([newExp, ...experiences]);
        setShowExpModal(false);
        setExpCompany('');
        setExpTitle('');
        setExpLocation('');
        setExpStartDate('');
        setExpEndDate('');
        setExpIsCurrent(false);
        setExpDescription('');
        router.refresh();
      }
    } finally {
      setSavingExp(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    const res = await fetch(`${apiUrl}/candidates/me/experiences/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setExperiences(experiences.filter((exp) => exp.id !== id));
      router.refresh();
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdu(true);

    try {
      const res = await fetch(`${apiUrl}/candidates/me/educations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          institution: eduInstitution,
          degree: eduDegree,
          fieldOfStudy: eduField || null,
          startDate: new Date(eduStartDate).toISOString(),
          endDate: eduEndDate ? new Date(eduEndDate).toISOString() : null,
          description: eduDescription || null,
        }),
      });

      if (res.ok) {
        const newEdu = await res.json();
        setEducations([newEdu, ...educations]);
        setShowEduModal(false);
        setEduInstitution('');
        setEduDegree('');
        setEduField('');
        setEduStartDate('');
        setEduEndDate('');
        setEduDescription('');
        router.refresh();
      }
    } finally {
      setSavingEdu(false);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    const res = await fetch(`${apiUrl}/candidates/me/educations/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setEducations(educations.filter((edu) => edu.id !== id));
      router.refresh();
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setSavingSkill(true);

    try {
      const res = await fetch(`${apiUrl}/candidates/me/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newSkillName.trim(),
          yearsOfExperience: newSkillYears !== '' ? Number(newSkillYears) : null,
          isPrimary: newSkillPrimary,
        }),
      });

      if (res.ok) {
        const savedSkill = await res.json();
        setSkills((prev) => {
          const filtered = prev.filter((s) => s.name.toLowerCase() !== savedSkill.name.toLowerCase());
          return [...filtered, savedSkill];
        });
        setNewSkillName('');
        setNewSkillYears('');
        setNewSkillPrimary(false);
        router.refresh();
      }
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    const res = await fetch(`${apiUrl}/candidates/me/skills/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setSkills(skills.filter((s) => s.id !== id));
      router.refresh();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Basic Profile Form */}
      <div className="card-3d p-6 sm:p-7 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Executive Dossier & Bio
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            This information powers AI semantic matching recommendations and verified recruiter talent search.
          </p>
        </div>

        {profileMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm ${
              profileMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
            }`}
          >
            {profileMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Professional Headline"
              placeholder="e.g. VP of Engineering / Senior Infrastructure Architect"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              helperText="High-impact summary that highlights your specialization"
              className="h-10 bg-background/80"
            />
            <Input
              label="Location"
              placeholder="e.g. San Francisco, CA or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 bg-background/80"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Years of Experience"
              type="number"
              min="0"
              max="70"
              placeholder="e.g. 10"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              className="h-10 bg-background/80"
            />
            <Input
              label="Contact Phone (Optional)"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 bg-background/80"
            />
          </div>

          <Textarea
            label="Professional Bio & Leadership Philosophy"
            placeholder="Tell employers about your architectural expertise, leadership style, and high-impact business outcomes..."
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="text-xs bg-background/80"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Input
              label="Website or Portfolio"
              placeholder="https://..."
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="h-10 bg-background/80"
            />
            <Input
              label="LinkedIn Profile"
              placeholder="https://linkedin.com/in/..."
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="h-10 bg-background/80"
            />
            <Input
              label="GitHub Profile"
              placeholder="https://github.com/..."
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="h-10 bg-background/80"
            />
          </div>

          <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={searchVisible}
                onChange={(e) => setSearchVisible(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              <span className="text-xs font-semibold text-foreground">Visible in Talent Search</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={openToRemote}
                onChange={(e) => setOpenToRemote(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              <span className="text-xs font-semibold text-foreground">Open to Remote Positions</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={savingProfile}
              className="btn-3d text-xs h-10 px-5 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Skills Section */}
      <div className="card-3d p-6 sm:p-7 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Skills & Technical Proficiencies
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add primary competencies to calibrate hybrid AI matching and deterministic filters.
          </p>
        </div>

        <form onSubmit={handleAddSkill} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-xs font-semibold text-foreground">Skill Name</label>
            <Input
              placeholder="e.g. Distributed Systems, Kubernetes, Go"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="h-10 bg-background/80"
            />
          </div>
          <div className="w-28 space-y-1">
            <label className="text-xs font-semibold text-foreground">Years Exp</label>
            <Input
              type="number"
              min="0"
              max="50"
              placeholder="e.g. 6"
              value={newSkillYears}
              onChange={(e) => setNewSkillYears(e.target.value)}
              className="h-10 bg-background/80"
            />
          </div>
          <label className="flex items-center gap-2 pb-2.5 cursor-pointer text-xs font-semibold">
            <input
              type="checkbox"
              checked={newSkillPrimary}
              onChange={(e) => setNewSkillPrimary(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            Primary Skill
          </label>
          <Button
            type="submit"
            variant="secondary"
            loading={savingSkill}
            className="btn-3d-secondary text-xs h-10 px-4"
          >
            Add Skill
          </Button>
        </form>

        {skills.length === 0 ? (
          <p className="text-xs text-muted-foreground italic p-4 text-center bg-muted/20 rounded-xl border border-border">
            No verified skills added yet. Add your core competencies above.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {skills.map((skill) => (
              <div key={skill.id} className="flex items-center gap-1 group">
                <SkillBadge
                  skill={skill.name}
                  verified={skill.isPrimary}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="text-xs text-muted-foreground hover:text-danger px-1 rounded transition-colors"
                  title="Remove skill"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Work Experience Section */}
      <div className="card-3d p-6 sm:p-7 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Work History & Leadership
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Detail your career progression and achievements.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowExpModal(!showExpModal)}
            className="btn-3d-secondary text-xs h-9 px-3"
          >
            {showExpModal ? 'Cancel' : '+ Add Experience'}
          </Button>
        </div>

        {showExpModal && (
          <form
            onSubmit={handleAddExperience}
            className="p-5 rounded-2xl border border-border bg-muted/30 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                placeholder="e.g. Stripe, Datadog"
                required
                value={expCompany}
                onChange={(e) => setExpCompany(e.target.value)}
                className="h-10 bg-background/80"
              />
              <Input
                label="Role Title *"
                placeholder="e.g. Principal Software Engineer"
                required
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                className="h-10 bg-background/80"
              />
            </div>
            <Input
              label="Location (Optional)"
              placeholder="e.g. New York, NY / Remote"
              value={expLocation}
              onChange={(e) => setExpLocation(e.target.value)}
              className="h-10 bg-background/80"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date *"
                type="date"
                required
                value={expStartDate}
                onChange={(e) => setExpStartDate(e.target.value)}
                className="h-10 bg-background/80"
              />
              {!expIsCurrent && (
                <Input
                  label="End Date"
                  type="date"
                  value={expEndDate}
                  onChange={(e) => setExpEndDate(e.target.value)}
                  className="h-10 bg-background/80"
                />
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={expIsCurrent}
                onChange={(e) => setExpIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              I currently work here
            </label>
            <Textarea
              label="Key Responsibilities & Quantified Impact"
              rows={3}
              placeholder="Highlights, achievements, architectural wins, and team scale..."
              value={expDescription}
              onChange={(e) => setExpDescription(e.target.value)}
              className="text-xs bg-background/80"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setShowExpModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={savingExp} className="btn-3d text-xs h-9 px-4">
                Save Experience
              </Button>
            </div>
          </form>
        )}

        {experiences.length === 0 ? (
          <p className="text-xs text-muted-foreground italic p-4 text-center bg-muted/20 rounded-xl border border-border">
            No work experience added yet. Add your positions above.
          </p>
        ) : (
          <div className="space-y-4 divide-y divide-border">
            {experiences.map((exp) => (
              <div key={exp.id} className="pt-4 first:pt-0 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-foreground text-base">{exp.title}</h3>
                  <p className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {exp.companyName} {exp.location ? `• ${exp.location}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    {new Date(exp.startDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                    })}{' '}
                    –{' '}
                    {exp.isCurrent
                      ? 'Present'
                      : exp.endDate
                      ? new Date(exp.endDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                        })
                      : 'Present'}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-foreground/80 mt-2 whitespace-pre-line leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="text-danger hover:text-danger/80 h-8 px-2 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education Section */}
      <div className="card-3d p-6 sm:p-7 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Education & Academic Credentials
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Degrees, academic honors, and higher education.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowEduModal(!showEduModal)}
            className="btn-3d-secondary text-xs h-9 px-3"
          >
            {showEduModal ? 'Cancel' : '+ Add Education'}
          </Button>
        </div>

        {showEduModal && (
          <form
            onSubmit={handleAddEducation}
            className="p-5 rounded-2xl border border-border bg-muted/30 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institution *"
                placeholder="e.g. Stanford University, MIT"
                required
                value={eduInstitution}
                onChange={(e) => setEduInstitution(e.target.value)}
                className="h-10 bg-background/80"
              />
              <Input
                label="Degree *"
                placeholder="e.g. B.S., M.S., Ph.D."
                required
                value={eduDegree}
                onChange={(e) => setEduDegree(e.target.value)}
                className="h-10 bg-background/80"
              />
            </div>
            <Input
              label="Field of Study"
              placeholder="e.g. Computer Science, Electrical Engineering"
              value={eduField}
              onChange={(e) => setEduField(e.target.value)}
              className="h-10 bg-background/80"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date *"
                type="date"
                required
                value={eduStartDate}
                onChange={(e) => setEduStartDate(e.target.value)}
                className="h-10 bg-background/80"
              />
              <Input
                label="End Date"
                type="date"
                value={eduEndDate}
                onChange={(e) => setEduEndDate(e.target.value)}
                className="h-10 bg-background/80"
              />
            </div>
            <Textarea
              label="Description (Optional)"
              rows={2}
              placeholder="Honors, publications, coursework..."
              value={eduDescription}
              onChange={(e) => setEduDescription(e.target.value)}
              className="text-xs bg-background/80"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setShowEduModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={savingEdu} className="btn-3d text-xs h-9 px-4">
                Save Education
              </Button>
            </div>
          </form>
        )}

        {educations.length === 0 ? (
          <p className="text-xs text-muted-foreground italic p-4 text-center bg-muted/20 rounded-xl border border-border">
            No education records added yet. Add your academic history above.
          </p>
        ) : (
          <div className="space-y-4 divide-y divide-border">
            {educations.map((edu) => (
              <div key={edu.id} className="pt-4 first:pt-0 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-foreground text-base">
                    {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                  </h3>
                  <p className="text-xs font-semibold text-primary">{edu.institution}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    {new Date(edu.startDate).getFullYear()} –{' '}
                    {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                  </p>
                  {edu.description && (
                    <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{edu.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="text-danger hover:text-danger/80 h-8 px-2 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
