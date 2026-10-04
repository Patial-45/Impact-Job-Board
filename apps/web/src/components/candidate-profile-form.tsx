'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, Card, SkillBadge } from '@executive-match/ui';
import type { CandidateProfileData } from '@/lib/api';

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
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

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

      setProfileMessage('Profile successfully updated.');
      router.refresh();
    } catch {
      setProfileMessage('Error saving profile. Please check all fields.');
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
      <Card variant="outline" className="p-6">
        <h2 className="text-xl font-semibold mb-1 text-foreground">Personal & Professional Info</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This information powers AI match recommendations and recruiter searches.
        </p>

        {profileMessage && (
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground">
            {profileMessage}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Professional Headline"
              placeholder="e.g. Senior Full-Stack Engineer"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              helperText="Brief summary that highlights your key role"
            />
            <Input
              label="Location"
              placeholder="e.g. San Francisco, CA or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Years of Experience"
              type="number"
              min="0"
              max="70"
              placeholder="e.g. 8"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
            />
            <Input
              label="Contact Phone (Optional)"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Textarea
            label="Professional Bio / Summary"
            placeholder="Tell employers about your leadership style, engineering focus, and key accomplishments..."
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Input
              label="Website or Portfolio"
              placeholder="https://..."
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
            <Input
              label="LinkedIn Profile"
              placeholder="https://linkedin.com/in/..."
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
            <Input
              label="GitHub Profile"
              placeholder="https://github.com/..."
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={searchVisible}
                onChange={(e) => setSearchVisible(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Visible in Recruiter Talent Search</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={openToRemote}
                onChange={(e) => setOpenToRemote(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Open to Remote Positions</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" loading={savingProfile}>
              Save Profile Info
            </Button>
          </div>
        </form>
      </Card>

      {/* Skills Section */}
      <Card variant="outline" className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Skills & Expertise</h2>
            <p className="text-sm text-muted-foreground">
              Add primary skills to improve matching accuracy.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddSkill} className="flex flex-wrap gap-3 items-end mb-6">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Skill Name"
              placeholder="e.g. TypeScript, Distributed Systems"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
            />
          </div>
          <div className="w-28">
            <Input
              label="Years Exp"
              type="number"
              min="0"
              max="50"
              placeholder="Years"
              value={newSkillYears}
              onChange={(e) => setNewSkillYears(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 pb-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={newSkillPrimary}
              onChange={(e) => setNewSkillPrimary(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            Primary Skill
          </label>
          <Button type="submit" variant="secondary" loading={savingSkill}>
            Add Skill
          </Button>
        </form>

        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No skills listed yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div key={skill.id} className="flex items-center gap-1 group">
                <SkillBadge
                  skill={skill.name}
                  verified={skill.isPrimary}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="text-xs text-muted-foreground hover:text-danger px-1 rounded"
                  title="Remove skill"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Work Experience Section */}
      <Card variant="outline" className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Work Experience</h2>
            <p className="text-sm text-muted-foreground">Detail your career progression.</p>
          </div>
          <Button variant="secondary" onClick={() => setShowExpModal(!showExpModal)}>
            {showExpModal ? 'Cancel' : '+ Add Experience'}
          </Button>
        </div>

        {showExpModal && (
          <form
            onSubmit={handleAddExperience}
            className="mb-8 p-4 rounded-xl border border-border bg-card/50 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                placeholder="e.g. Acme Corp"
                required
                value={expCompany}
                onChange={(e) => setExpCompany(e.target.value)}
              />
              <Input
                label="Role Title"
                placeholder="e.g. Principal Software Engineer"
                required
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
              />
            </div>
            <Input
              label="Location (Optional)"
              placeholder="e.g. New York, NY"
              value={expLocation}
              onChange={(e) => setExpLocation(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                required
                value={expStartDate}
                onChange={(e) => setExpStartDate(e.target.value)}
              />
              {!expIsCurrent && (
                <Input
                  label="End Date"
                  type="date"
                  value={expEndDate}
                  onChange={(e) => setExpEndDate(e.target.value)}
                />
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                checked={expIsCurrent}
                onChange={(e) => setExpIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              I currently work here
            </label>
            <Textarea
              label="Key Responsibilities & Achievements"
              rows={3}
              placeholder="Highlights, achievements, metrics and technologies used..."
              value={expDescription}
              onChange={(e) => setExpDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowExpModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={savingExp}>
                Save Experience
              </Button>
            </div>
          </form>
        )}

        {experiences.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No work experience added yet.</p>
        ) : (
          <div className="space-y-4 divide-y divide-border">
            {experiences.map((exp) => (
              <div key={exp.id} className="pt-4 first:pt-0 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-foreground text-base">{exp.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {exp.companyName} {exp.location ? `• ${exp.location}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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
                    <p className="text-sm text-foreground/80 mt-2 whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="text-danger hover:text-danger/80"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Education Section */}
      <Card variant="outline" className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Education</h2>
            <p className="text-sm text-muted-foreground">Degrees and academic background.</p>
          </div>
          <Button variant="secondary" onClick={() => setShowEduModal(!showEduModal)}>
            {showEduModal ? 'Cancel' : '+ Add Education'}
          </Button>
        </div>

        {showEduModal && (
          <form
            onSubmit={handleAddEducation}
            className="mb-8 p-4 rounded-xl border border-border bg-card/50 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institution"
                placeholder="e.g. Stanford University"
                required
                value={eduInstitution}
                onChange={(e) => setEduInstitution(e.target.value)}
              />
              <Input
                label="Degree"
                placeholder="e.g. B.S."
                required
                value={eduDegree}
                onChange={(e) => setEduDegree(e.target.value)}
              />
            </div>
            <Input
              label="Field of Study"
              placeholder="e.g. Computer Science"
              value={eduField}
              onChange={(e) => setEduField(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                required
                value={eduStartDate}
                onChange={(e) => setEduStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={eduEndDate}
                onChange={(e) => setEduEndDate(e.target.value)}
              />
            </div>
            <Textarea
              label="Description (Optional)"
              rows={2}
              placeholder="Honors, activities, thesis..."
              value={eduDescription}
              onChange={(e) => setEduDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowEduModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={savingEdu}>
                Save Education
              </Button>
            </div>
          </form>
        )}

        {educations.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No education records added yet.</p>
        ) : (
          <div className="space-y-4 divide-y divide-border">
            {educations.map((edu) => (
              <div key={edu.id} className="pt-4 first:pt-0 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-foreground text-base">
                    {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                  </h3>
                  <p className="text-sm text-muted-foreground">{edu.institution}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(edu.startDate).getFullYear()} –{' '}
                    {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                  </p>
                  {edu.description && (
                    <p className="text-sm text-foreground/80 mt-2">{edu.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="text-danger hover:text-danger/80"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
